import { Inject, Injectable, InjectAll } from '@guarani/di';
import {
  InvalidJsonWebKeySetException,
  JsonWebKey,
  JsonWebKeySet,
  JsonWebSignature,
  JsonWebSignatureAlgorithm,
  JsonWebSignatureHeaderParameters,
  JsonWebTokenClaims,
  OctetSequenceKey,
} from '@guarani/jose';

import { Buffer } from 'buffer';
import https from 'https';
import { URL } from 'url';

import { JwtBearerTokenContext } from '../../context/token/jwt-bearer.token.context';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { JwtBearerTokenRequest } from '../../requests/token/jwt-bearer.token-request';
import { UserServiceInterface } from '../../services/user.service.interface';
import { USER_SERVICE } from '../../services/user.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Implementation of the **JWT Bearer** Token Request Validator.
 */
@Injectable()
export class JwtBearerTokenRequestValidator extends TokenRequestValidator<
  JwtBearerTokenRequest,
  JwtBearerTokenContext
> {
  /**
   * JSON Web Signature Algorithms.
   */
  private readonly algorithms: Exclude<JsonWebSignatureAlgorithm, 'none'>[] = [
    'ES256',
    'ES384',
    'ES512',
    'EdDSA',
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
   * Name of the Grant Type that uses this Validator.
   */
  public readonly name: GrantType = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

  /**
   * Instantiates a new JWT Bearer Token Request Validator.
   *
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   * @param userService Instance of the User Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    protected readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) protected readonly settings: Settings,
    @Inject(USER_SERVICE) protected readonly userService: UserServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[]
  ) {
    super(clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<JwtBearerTokenContext> {
    const parameters = <JwtBearerTokenRequest>request.body;

    const context = await super.validate(request);

    const user = await this.getSubjectFromAssertion(parameters, context.client);
    const scopes = this.getScopes(parameters, context.client);

    return { ...context, user, scopes };
  }

  /**
   * Returns the End User represented by the Client in its Assertion.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client requesting authorization.
   * @returns End User represented in the Assertion.
   */
  private async getSubjectFromAssertion(parameters: JwtBearerTokenRequest, client: Client): Promise<User> {
    if (typeof parameters.assertion !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "assertion".' });
    }

    try {
      const { header, payload } = JsonWebSignature.decode(parameters.assertion);

      if (header.alg === 'none') {
        throw new InvalidGrantException({
          description: 'The Authorization Server disallows using the JSON Web Signature Algorithm "none".',
        });
      }

      const claims = await JsonWebTokenClaims.parse(payload, {
        validationOptions: {
          iss: { essential: true, value: client.id },
          sub: { essential: true },
          aud: { essential: true, value: new URL('/oauth/token', this.settings.issuer).href },
          exp: { essential: true },
        },
      });

      const key = await this.getClientKey(client, header);

      await JsonWebSignature.verify(parameters.assertion, key, this.algorithms);

      return await this.getUser(claims.sub!);
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

    return new OctetSequenceKey({ kty: 'oct', k: Buffer.from(client.secret, 'utf8').toString('base64url') });
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
      clientJwks = await JsonWebKeySet.load(client.jwks);
    }

    if (clientJwks === null) {
      throw new InvalidGrantException({ description: 'The provided Assertion is invalid.' });
    }

    const jwk = clientJwks.find((key) => {
      return (
        key.kid === header.kid &&
        (key.alg === undefined || this.algorithms.includes(<Exclude<JsonWebSignatureAlgorithm, 'none'>>key.alg)) &&
        (key.key_ops?.includes('verify') ?? true) &&
        (key.use === undefined || key.use === 'sig')
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
        res.on('end', async () => {
          try {
            resolve(await JsonWebKeySet.parse(responseBody));
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

  /**
   * Checks if the provided scope is supported by the Authorization Server and if the Client is allowed to request it,
   * then return the granted scopes for further processing.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Scopes granted to the Client.
   */
  protected getScopes(parameters: JwtBearerTokenRequest, client: Client): string[] {
    if (parameters.scope !== undefined && typeof parameters.scope !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "scope".' });
    }

    this.scopeHandler.checkRequestedScope(parameters.scope);

    if (parameters.scope !== undefined) {
      parameters.scope.split(' ').forEach((requestedScope) => {
        if (!client.scopes.includes(requestedScope)) {
          throw new AccessDeniedException({
            description: `The Client is not allowed to request the scope "${requestedScope}".`,
          });
        }
      });
    }

    return this.scopeHandler.getAllowedScopes(client, parameters.scope);
  }
}
