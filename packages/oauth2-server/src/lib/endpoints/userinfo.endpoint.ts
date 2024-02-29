import { Buffer } from 'buffer';
import { OutgoingHttpHeaders } from 'http';

import { Inject, Injectable } from '@guarani/di';
import {
  JsonWebEncryption,
  JsonWebEncryptionHeader,
  JsonWebKeySet,
  JsonWebSignature,
  JsonWebSignatureHeader,
  JsonWebTokenClaims,
} from '@guarani/jose';
import { removeNullishValues } from '@guarani/primitives';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { InsufficientScopeException } from '../exceptions/insufficient-scope.exception';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { ClientAuthorizationHandler } from '../handlers/client-authorization.handler';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { UserinfoClaimsParameters } from '../id-token/userinfo.claims.parameters';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { calculateSubjectIdentifier } from '../utils/calculate-subject-identifier';
import { getClientJsonWebKey } from '../utils/get-client-jsonwebkey';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Userinfo** Endpoint.
 *
 * This endpoint is used by the Client to retrieve claims about the End User represented by the provided Access Token.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#UserInfo
 */
@Injectable()
export class UserinfoEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'userinfo';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/userinfo';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['GET', 'POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Userinfo Endpoint.
   *
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param jwks JSON Web Key Set of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param userService Instance of the User Service.
   */
  public constructor(
    private readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    private readonly jwks: JsonWebKeySet,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface,
  ) {
    if (typeof this.userService.getUserinfo !== 'function') {
      throw new TypeError('Missing implementation of required method "UserServiceInterface.getUserinfo".');
    }
  }

  /**
   * Creates a Http JSON Access Token Response.
   *
   * This method is responsible for returning the claims about the End User represented by the provided Access Token.
   *
   * If the Access Token provided by the Client is invalid, expired, malformed or lacks the necessary scopes,
   * this method will return an error response with the parameters in the **WWW-Authenticate** header and the body.
   *
   * If the flow succeeds, the Client will then receive a JSON object containing the claims about the End User
   * based on the scopes granted to the Client at the Access Token.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { client, scopes, user } = await this.authorize(request);
      const claims = await this.getUserinfo(client!, user!, scopes);

      const response = new HttpResponse().setHeaders(this.headers);

      if (client!.userinfoSignedResponseAlgorithm === null) {
        return response.json(removeNullishValues(claims));
      }

      const jwt = await this.generateJsonWebTokenResponse(client!, claims);
      return response.jwt(jwt);
    } catch (exc: unknown) {
      const error =
        exc instanceof OAuth2Exception
          ? exc
          : new ServerErrorException('An unexpected error occurred.', { cause: exc });

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(removeNullishValues(error.toJSON()));
    }
  }

  /**
   * Retrieves the Access Token from the Authorization Header and validates it.
   *
   * @param request Http Request.
   * @returns Access Token based on the handle provided by the Client.
   */
  private async authorize(request: HttpRequest): Promise<AccessToken> {
    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (!accessToken.scopes.includes('openid')) {
      throw new InsufficientScopeException('The provided Access Token is missing the required scope "openid".');
    }

    if (accessToken.client === null) {
      throw new InvalidTokenException('Invalid Credentials.');
    }

    if (accessToken.user === null) {
      throw new InvalidTokenException('Invalid Credentials.');
    }

    return accessToken;
  }

  /**
   * Retrieves claims about the provided User based on the provided scopes.
   *
   * @param client Client of the Request.
   * @param user End User to have it's information gathered.
   * @param scopes Scopes requested by the Client.
   * @returns Claims about the provided User.
   */
  private async getUserinfo(client: Client, user: User, scopes: string[]): Promise<UserinfoClaimsParameters> {
    // UserService.getUserinfo() does not return the "sub" claim.
    const claims: UserinfoClaimsParameters = { sub: calculateSubjectIdentifier(user, client, this.settings) };
    return Object.assign(claims, await this.userService.getUserinfo!(user, scopes));
  }

  /**
   * Generates a JSON Web Token containing the Userinfo Claims to be returned to the Client.
   *
   * @param client Client of the Request.
   * @param claims Claims containing the Userinfo retrieved by the Authorization Server.
   * @returns JSON Web Token containing the Userinfo Claims.
   */
  private async generateJsonWebTokenResponse(client: Client, claims: UserinfoClaimsParameters): Promise<string> {
    const signKey = this.jwks.get((jwk) => jwk.alg === client.userinfoSignedResponseAlgorithm! && jwk.use === 'sig');

    const jwsHeader = new JsonWebSignatureHeader({
      alg: client.userinfoSignedResponseAlgorithm!,
      kid: signKey.kid,
      typ: 'JWT',
    });

    const jws = new JsonWebSignature(jwsHeader, new JsonWebTokenClaims(claims).toBuffer());

    const signedJwt = await jws.sign(signKey);

    if (client.userinfoEncryptedResponseKeyWrap === null) {
      return signedJwt;
    }

    const keyWrapKey = await getClientJsonWebKey(client, (key) => {
      return (
        key.alg === client.userinfoEncryptedResponseKeyWrap! && (typeof key.use === 'undefined' || key.use === 'enc')
      );
    });

    const jweHeader = new JsonWebEncryptionHeader({
      alg: client.userinfoEncryptedResponseKeyWrap,
      enc: client.userinfoEncryptedResponseContentEncryption!,
      cty: 'JWT',
      kid: keyWrapKey.kid,
    });

    const jwe = new JsonWebEncryption(jweHeader, Buffer.from(signedJwt, 'ascii'));

    return await jwe.encrypt(keyWrapKey);
  }
}
