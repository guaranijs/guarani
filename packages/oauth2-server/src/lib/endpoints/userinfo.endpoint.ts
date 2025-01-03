import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
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
import { AuthHandler } from '../handlers/auth.handler';
import { ClientAuthorizationHandler } from '../handlers/client-authorization.handler';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { UserClaimsParameters } from '../tokens/user.claims.parameters';
import { AuthorizationRequestClaimsParameter } from '../types/authorization-request-claims-parameter.type';
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
   * @param logger Logger of the Authorization Server.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param authHandler Instance of the Auth Handler.
   * @param jwks JSON Web Key Set of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param userService Instance of the User Service.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    private readonly authHandler: AuthHandler,
    private readonly jwks: JsonWebKeySet,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface,
  ) {
    if (typeof this.userService.getUserClaims !== 'function') {
      const exc = new TypeError('Missing implementation of required method "UserServiceInterface.getUserClaims".');

      this.logger.critical(
        `[${this.constructor.name}] Missing implementation of required method "UserServiceInterface.getUserClaims"`,
        '93b62e3b-89a1-4f64-b741-c31ae229e626',
        null,
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called handle()`, 'e0e363f3-62a5-4c3a-af87-9eca9c88dd76', {
      request,
    });

    try {
      const { claims, client, scopes, user } = await this.authorize(request);
      const userClaims = await this.getUserClaims(client!, user!, scopes, claims);

      const response = new HttpResponse().setHeaders(this.headers);

      if (client!.userinfoSignedResponseAlgorithm === null) {
        response.json(removeNullishValues(userClaims));

        this.logger.debug(
          `[${this.constructor.name}] JSON Userinfo completed`,
          'c9605a97-e352-42ef-b282-872bc5824e68',
          { response },
        );

        return response;
      }

      const jwt = await this.generateJsonWebTokenResponse(client!, userClaims);

      response.jwt(jwt);

      this.logger.debug(`[${this.constructor.name}] JWT Userinfo completed`, 'f1535b10-ad0b-44e2-8930-cb30b91d0690', {
        response,
      });

      return response;
    } catch (exc: unknown) {
      const error =
        exc instanceof OAuth2Exception
          ? exc
          : new ServerErrorException('An unexpected error occurred.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Error on Userinfo Endpoint`,
        'ed5d6f2d-fc31-48d8-a536-6a58dc28877f',
        { request },
        error,
      );

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
   * @returns Access Token based on the Identifier provided by the Client.
   */
  private async authorize(request: HttpRequest): Promise<AccessToken> {
    this.logger.debug(`[${this.constructor.name}] Called authorize()`, '3f9bcc0b-5381-4a1f-88d5-14f82db1f618', {
      request,
    });

    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (!accessToken.scopes.includes('openid')) {
      const exc = new InsufficientScopeException('The provided Access Token is missing the required scope "openid".');

      this.logger.error(
        `[${this.constructor.name}] The provided Access Token is missing the required scope "openid"`,
        '548b0586-3721-4a73-95c9-d3ed2fb4eb80',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    if (accessToken.client === null) {
      const exc = new InvalidTokenException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] Cannot use a Registration Access Token on Userinfo Endpoint`,
        'd929765d-2dc3-43b6-8dfa-46fb2e13a894',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    if (accessToken.user === null) {
      const exc = new InvalidTokenException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] Missing User on Access Token`,
        '86c5ea60-f7da-45f9-b34a-f549754f4e98',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    const authUser = await this.authHandler.findAuthUser(request);

    if (authUser === null && !accessToken.scopes.includes('offline_access')) {
      const exc = new InvalidTokenException('The Access Token does not allow Offline Access.');

      this.logger.error(
        `[${this.constructor.name}] The Access Token does not allow Offline Access`,
        '0a0ad58f-e34a-4ea5-b1cd-c7ccd73858ce',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    if (
      authUser !== null &&
      (authUser.id.length !== accessToken.user.id.length ||
        !timingSafeEqual(Buffer.from(authUser.id), Buffer.from(accessToken.user.id)))
    ) {
      const exc = new InvalidTokenException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] Mismatching User Identifiers`,
        '0cbc3c3c-2a2f-4399-a909-fc1f08949294',
        { access_token: accessToken },
        exc,
      );

      throw exc;
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
  private async getUserClaims(
    client: Client,
    user: User,
    scopes: string[],
    claims: AuthorizationRequestClaimsParameter,
  ): Promise<UserClaimsParameters> {
    // UserServiceInterface.getUserClaims() does not return the "sub" claim.
    const userClaims: UserClaimsParameters = { sub: calculateSubjectIdentifier(user, client, this.settings) };
    return Object.assign(userClaims, await this.userService.getUserClaims!(user, scopes, claims));
  }

  /**
   * Generates a JSON Web Token containing the Userinfo Claims to be returned to the Client.
   *
   * @param client Client of the Request.
   * @param claims Claims containing the Userinfo retrieved by the Authorization Server.
   * @returns JSON Web Token containing the Userinfo Claims.
   */
  private async generateJsonWebTokenResponse(client: Client, claims: UserClaimsParameters): Promise<string> {
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
