import { Inject, Injectable } from '@guarani/di';
import {
  InvalidJsonWebKeySetException,
  JsonWebKey,
  JsonWebKeySet,
  JsonWebSignature,
  JsonWebSignatureHeaderParameters,
  JsonWebTokenClaims,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';

import { Buffer } from 'buffer';
import https from 'https';

import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { JwtBearerTokenRequest } from '../messages/jwt-bearer.token-request';
import { TokenResponse } from '../messages/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { createTokenResponse } from '../utils/create-token-response';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';

/**
 * Implementation of the **JWT Bearer** Grant Type.
 *
 * In this Grant Type the Client provides a JSON Web Token Assertion as its Authorization Grant
 * and exchanges it for an Access Token.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7523.html
 */
@Injectable()
export class JwtBearerGrantType implements GrantTypeInterface {
  /**
   * JSON Web Signature Algorithms.
   */
  private readonly algorithms: JsonWebSignatureAlgorithm[] = [
    'ES256',
    'ES384',
    'ES512',
    'HS256',
    'HS384',
    'HS512',
    'PS256',
    'PS384',
    'PS512',
    'RS256',
    'RS384',
    'RS512',
  ];

  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

  /**
   * Instantiates a new JWT Bearer Grant Type.
   *
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param userService Instance of the User Service.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) protected readonly settings: Settings,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface
  ) {}

  /**
   * Creates an Access Token Response with the Access Token issued to the Client.
   *
   * In this flow, the Client presents a JSON Web Token Assertion signed with one of its JSON Web Keys
   * as an Authorization Grant for the Token Endpoint. Once the signature of the JSON Web Token is verified,
   * the Authorization Server issues an Access Token to the Client.
   *
   * It does not issue a Refresh Token, since the Client can generate a new JSON Web Token Assertion
   * and present it to the Token Endpoint without the need to reauthenticate the End User.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Access Token Response.
   */
  public async handle(parameters: JwtBearerTokenRequest, client: Client): Promise<TokenResponse> {
    this.checkParameters(parameters);

    const user = await this.getSubjectFromAssertion(parameters.assertion, client);
    const scopes = this.scopeHandler.getAllowedScopes(client, parameters.scope);
    const accessToken = await this.accessTokenService.create(scopes, client, user);

    return createTokenResponse(accessToken);
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param parameters Parameters of the Token Request.
   */
  private checkParameters(parameters: JwtBearerTokenRequest): void {
    const { assertion, scope } = parameters;

    if (typeof assertion !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "assertion".' });
    }

    this.scopeHandler.checkRequestedScope(scope);
  }

  /**
   * Returns the End User represented by the Client in its Assertion.
   *
   * @param assertion JSON Web Token Assertion provided by the Client.
   * @param client Client requesting authorization.
   * @returns End User represented in the Assertion.
   */
  private async getSubjectFromAssertion(assertion: string, client: Client): Promise<User> {
    try {
      const [header, payload] = JsonWebSignature.decode(assertion);

      if (header.alg === 'none') {
        throw new InvalidGrantException({ description: 'Invalid JSON Web Signature Algorithm "none".' });
      }

      const claims = new JsonWebTokenClaims(JSON.parse(payload.toString('utf8')), {
        iss: { essential: true, value: client.id },
        sub: { essential: true },
        aud: { essential: true, value: new URL('/oauth/token', this.settings.issuer).href },
        exp: { essential: true },
      });

      const key = await this.getClientKey(client, header);

      await JsonWebSignature.verify(assertion, key, this.algorithms);

      return await this.getUser(<string>claims.sub);
    } catch (exc: unknown) {
      if (exc instanceof OAuth2Exception) {
        throw exc;
      }

      const exception = new InvalidGrantException({ description: 'The provided Assertion is invalid.' });
      exception.cause = exc;

      throw exception;
    }
  }

  /**
   * Returns the JSON Web Key of the Client used to validate the Assertion.
   *
   * @param client Client of the Request.
   * @param header JSON Web Signature Header of the Assertion.
   * @returns JSON Web Key of the Client based on the JSON Web Signature Header.
   */
  private async getClientKey(client: Client, header: JsonWebSignatureHeaderParameters): Promise<JsonWebKey> {
    return (<JsonWebSignatureAlgorithm[]>['HS256', 'HS384', 'HS512']).includes(header.alg)
      ? await this.getClientSecretKey(client)
      : await this.getClientPublicKey(client, header);
  }

  /**
   * Returns the Client Secret as a JSON Web Key.
   *
   * @param client Client of the Request.
   * @returns JSON Web Key of the Client Secret.
   */
  private async getClientSecretKey(client: Client): Promise<JsonWebKey> {
    if (client.secret == null || (client.secretExpiresAt != null && new Date() >= client.secretExpiresAt)) {
      throw new InvalidGrantException({ description: 'The provided Assertion is invalid.' });
    }

    return new JsonWebKey({ kty: 'oct', k: Buffer.from(client.secret, 'utf8').toString('base64url') });
  }

  /**
   * Returns the Public JSON Web Key of the Client used to validate the Assertion.
   *
   * @param client Client of the Request.
   * @param header JSON Web Signature Header of the Assertion.
   * @returns JSON Web Key of the Client based on the JSON Web Signature Header.
   */
  private async getClientPublicKey(client: Client, header: JsonWebSignatureHeaderParameters): Promise<JsonWebKey> {
    let clientJwks: JsonWebKeySet | null = null;

    if (client.jwksUri != null) {
      clientJwks = await this.getClientJwksFromUri(client.jwksUri);
    } else if (client.jwks != null) {
      clientJwks = JsonWebKeySet.load(client.jwks);
    }

    if (clientJwks === null) {
      throw new InvalidGrantException({ description: 'The provided Assertion is invalid.' });
    }

    const jwk = clientJwks.find((key) => {
      return (
        key.kid === header.kid &&
        (key.key_ops?.includes('verify') ?? true) &&
        (key.use !== undefined ? key.use === 'sig' : true)
      );
    });

    if (jwk === null) {
      throw new InvalidGrantException({ description: 'The provided Assertion is invalid.' });
    }

    return jwk;
  }

  /**
   * Fetches the JSON Web Key Set of the Client hosted at the provided URI.
   *
   * @param jwksUri URI of the JSON Web Key Set of the Client.
   * @returns JSON Web Key Set of the Client.
   */
  private getClientJwksFromUri(jwksUri: string): Promise<JsonWebKeySet> {
    return new Promise((resolve, reject) => {
      const request = https.request(jwksUri, (res) => {
        let responseBody = '';

        res.setEncoding('utf8');

        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve(JsonWebKeySet.parse(responseBody));
          } catch (exc: unknown) {
            const exception = new InvalidJsonWebKeySetException();
            exception.cause = exc;

            reject(exception);
          }
        });
      });

      request.on('error', (error) => {
        const exception = new InvalidJsonWebKeySetException();
        exception.cause = error;

        reject(exception);
      });

      request.end();
    });
  }

  /**
   * Fetches an End User from the application's storage based on the provided Identifier.
   *
   * @param id Identifier of the End User.
   * @returns End User based on the provided Identifier.
   */
  private async getUser(id: string): Promise<User> {
    const user = await this.userService.findOne(id);

    if (user === null) {
      throw new InvalidGrantException({ description: 'The provided Assertion is invalid.' });
    }

    return user;
  }
}
