import { Buffer } from 'buffer';
import https from 'https';
import { URL } from 'url';

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
import { Nullable } from '@guarani/types';

import { JwtBearerTokenContext } from '../../context/token/jwt-bearer.token-context';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
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
export class JwtBearerTokenRequestValidator extends TokenRequestValidator<JwtBearerTokenContext> {
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
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   * @param userService Instance of the User Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    private readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[],
  ) {
    super(logger, clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<JwtBearerTokenContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, 'a8021085-541a-49a4-8683-ec324cee9ef7', {
      request,
    });

    const context = await super.validate(request);

    const { parameters } = context;

    const user = await this.getSubjectFromAssertion(parameters, context.client);
    const scopes = this.getScopes(parameters, context.client);

    Object.assign<JwtBearerTokenContext, Partial<JwtBearerTokenContext>>(context, { user, scopes });

    this.logger.debug(
      `[${this.constructor.name}] JSON Web Token Bearer Token Request validation completed`,
      'c196e2a1-c423-4580-ad14-24d7983c610f',
      { context },
    );

    return context;
  }

  /**
   * Returns the End User represented by the Client in its Assertion.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client requesting authorization.
   * @returns End User represented in the Assertion.
   */
  private async getSubjectFromAssertion(parameters: JwtBearerTokenRequest, client: Client): Promise<User> {
    this.logger.debug(
      `[${this.constructor.name}] Called getSubjectFromAssertion()`,
      'f8bcb301-0ce8-4d5f-abcc-66331f32ed7d',
      { parameters, client },
    );

    if (typeof parameters.assertion === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "assertion".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "assertion"`,
        'beb456cd-ce83-4b95-b595-4373f6d42695',
        { parameters },
        exc,
      );

      throw exc;
    }

    try {
      const { header, payload } = JsonWebSignature.decode(parameters.assertion);

      if (header.alg === 'none') {
        const exc = new InvalidGrantException(
          'The Authorization Server disallows using the JSON Web Signature Algorithm "none".',
        );

        this.logger.error(
          `[${this.constructor.name}] The Authorization Server disallows using the JSON Web Signature Algorithm "none"`,
          'c9353b6a-02c1-425c-bc71-b8765c4e1b3a',
          { header },
          exc,
        );

        throw exc;
      }

      const idTokenAudience = new URL('/oauth/token', this.settings.issuer).href;

      const claims = await JsonWebTokenClaims.parse(payload, {
        validationOptions: {
          iss: { essential: true, value: client.id },
          sub: { essential: true },
          aud: { essential: true, values: [idTokenAudience, [idTokenAudience]] },
          exp: { essential: true },
        },
      });

      const key = await this.getClientKey(client, header);

      await JsonWebSignature.verify(parameters.assertion, key, this.algorithms);

      return await this.getUser(claims.sub!);
    } catch (exc: unknown) {
      const exception =
        exc instanceof OAuth2Exception
          ? exc
          : new InvalidGrantException('The provided Assertion is invalid.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] ${exception.message}`,
        '07fe7cd3-1cae-4ac0-bb32-14574ae8ef59',
        null,
        exception,
      );

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
    this.logger.debug(`[${this.constructor.name}] Called getClientKey()`, 'c98ecc74-6692-4f43-991c-089b45957e8e', {
      client,
      header,
    });

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
    this.logger.debug(
      `[${this.constructor.name}] Called getClientSecretKey()`,
      '49d9f9b9-8740-4427-9ca1-0ec1bfcb30ad',
      { client },
    );

    if (client.secret === null) {
      const exc = new InvalidGrantException('The provided Assertion is invalid.');

      this.logger.error(
        `[${this.constructor.name}] The Client does not have a Secret`,
        '0fbe5079-4c8e-4a52-aa3d-00c958498c79',
        { client },
        exc,
      );

      throw exc;
    }

    if (client.secretExpiresAt !== null && new Date() >= client.secretExpiresAt) {
      const exc = new InvalidGrantException('The provided Assertion is invalid.');

      this.logger.error(
        `[${this.constructor.name}] The Secret of the Client expired`,
        '043d8fda-4dc9-4f03-bf8e-62ff0bc96dd0',
        { client },
        exc,
      );

      throw exc;
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
  // TODO: Use getClientJsonWebKey() util function.
  private async getClientPublicKey(client: Client, header: JsonWebSignatureHeaderParameters): Promise<JsonWebKey> {
    this.logger.debug(
      `[${this.constructor.name}] Called getClientPublicKey()`,
      'ad5e7ad7-4840-4481-a48a-8f2df5990153',
      { client, header },
    );

    let clientJwks: Nullable<JsonWebKeySet> = null;

    if (client.jwksUri !== null) {
      clientJwks = await this.getClientJwksFromUri(client.jwksUri);
    } else if (client.jwks !== null) {
      clientJwks = await JsonWebKeySet.load(client.jwks);
    }

    if (clientJwks === null) {
      const exc = new InvalidGrantException('The provided Assertion is invalid.');

      this.logger.error(
        `[${this.constructor.name}] The Client does not have a JSON Web Key Set`,
        'f1be7f0c-053c-45aa-a935-05b1afc4a57c',
        { client },
        exc,
      );

      throw exc;
    }

    const jwk = clientJwks.find((key) => {
      return (
        key.kid === header.kid &&
        (typeof key.alg === 'undefined' ||
          this.algorithms.includes(<Exclude<JsonWebSignatureAlgorithm, 'none'>>key.alg)) &&
        (key.key_ops?.includes('verify') ?? true) &&
        (typeof key.use === 'undefined' || key.use === 'sig')
      );
    });

    if (jwk === null) {
      const exc = new InvalidGrantException('The provided Assertion is invalid.');

      this.logger.error(
        `[${this.constructor.name}] The Client does not have a JSON Web Key that matches the one on the header`,
        'fcb1a9fc-0677-40d5-89b3-9ef54c63f983',
        { client },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getClientJwksFromUri()`,
      'b3f281aa-ba01-4355-acae-b83a44e82a5e',
      { jwks_uri: jwksUri },
    );

    return new Promise((resolve, reject) => {
      const request = https.request(jwksUri, (res) => {
        let responseBody = '';

        res.setEncoding('utf8');

        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', async () => {
          try {
            resolve(await JsonWebKeySet.parse(responseBody));
          } catch (exc: unknown) {
            const exception = new InvalidJsonWebKeySetException(undefined, { cause: exc });

            this.logger.error(
              `[${this.constructor.name}] ${exception.message}`,
              '5ccf118d-abe8-4d53-abc3-06f34874f955',
              null,
              exception,
            );

            reject(exception);
          }
        });
      });

      request.on('error', (exc) => {
        const exception = new InvalidJsonWebKeySetException(undefined, { cause: exc });

        this.logger.error(
          `[${this.constructor.name}] ${exception.message}`,
          '8be68fb9-0506-4a67-a17a-94c33e6f288d',
          null,
          exception,
        );

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
    this.logger.debug(`[${this.constructor.name}] Called getUser()`, '8c34b7ed-5b8c-4e83-82ae-f05680edfae5', { id });

    const user = await this.userService.findOne(id);

    if (user === null) {
      const exc = new InvalidGrantException('The provided Assertion is invalid.');

      this.logger.error(
        `[${this.constructor.name}] Could not find the User of the Assertion`,
        '5e0d0a94-11d3-4a91-9b3e-085511a77a07',
        null,
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getScopes()`, '24ba1fa3-3679-4d4c-a3cc-2cb8c9f4ec15', {
      parameters,
      client,
    });

    this.scopeHandler.checkRequestedScope(parameters.scope ?? null);

    return this.scopeHandler.getAllowedScopes(client, parameters.scope ?? null);
  }
}
