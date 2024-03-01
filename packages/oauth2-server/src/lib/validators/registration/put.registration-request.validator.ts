import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';

import { Inject, Injectable } from '@guarani/di';
import { isPlainObject } from '@guarani/primitives';
import { Nullable } from '@guarani/types';

import { PutRegistrationContext } from '../../context/registration/put.registration-context';
import { AccessToken } from '../../entities/access-token.entity';
import { Client } from '../../entities/client.entity';
import { InsufficientScopeException } from '../../exceptions/insufficient-scope.exception';
import { InvalidClientMetadataException } from '../../exceptions/invalid-client-metadata.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { InvalidTokenException } from '../../exceptions/invalid-token.exception';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { HttpMethod } from '../../http/http-method.type';
import { Logger } from '../../logger/logger';
import { PutBodyRegistrationRequest } from '../../requests/registration/put-body.registration-request';
import { PutQueryRegistrationRequest } from '../../requests/registration/put-query.registration-request';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../../services/access-token.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { PostAndPutRegistrationRequestValidator } from './post-and-put.registration-request.validator';

/**
 * Implementation of the Put Registration Request Validator.
 */
@Injectable()
export class PutRegistrationRequestValidator extends PostAndPutRegistrationRequestValidator<PutRegistrationContext> {
  /**
   * Http Method that uses this validator.
   */
  public readonly httpMethod: HttpMethod = 'PUT';

  /**
   * Scopes that grant access to the Put Client Registration Request.
   */
  public readonly expectedScopes: string[] = ['client:manage', 'client:update'];

  /**
   * Instantiates a new Put Registration Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param scopeHandler Instance of the Scope Handler.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly scopeHandler: ScopeHandler,
    protected override readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    @Inject(ACCESS_TOKEN_SERVICE) protected override readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(SETTINGS) protected override readonly settings: Settings,
  ) {
    super(logger, scopeHandler, clientAuthorizationHandler, accessTokenService, settings);
  }

  /**
   * Validates the Registration Request and returns the actors of the Registration Context.
   *
   * @param request Http Request.
   * @returns Dynamic Client Registration Context.
   */
  public override async validate(request: HttpRequest): Promise<PutRegistrationContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '88314bc2-a002-4131-92f3-2a78b6795509', {
      request,
    });

    const queryParameters = request.query as PutQueryRegistrationRequest;
    const bodyParameters = request.json<PutBodyRegistrationRequest>();

    if (!isPlainObject(bodyParameters)) {
      const exc = new InvalidRequestException('Invalid Http Request Body.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Http Request Body`,
        'ef354f42-2b91-4d2e-8f96-cc66fad72953',
        null,
        exc,
      );

      throw exc;
    }

    const queryClientId = this.getQueryClientId(queryParameters);
    const bodyClientId = this.getBodyClientId(bodyParameters);

    const clientId = this.checkClientId(queryClientId, bodyClientId);
    const clientSecret = this.getClientSecret(bodyParameters);

    const accessToken = await this.authorize(request, clientId);

    this.checkClientCredentials(accessToken.client!, clientSecret);

    const context = await super.validate(request);

    Object.assign<PutRegistrationContext, Partial<PutRegistrationContext>>(context, {
      queryParameters,
      bodyParameters,
      accessToken,
      client: accessToken.client!,
      clientId,
      clientSecret,
    });

    this.logger.debug(
      `[${this.constructor.name}] Put Registration Request validation completed`,
      '5af888ba-1548-4ad3-9de6-3132d98e55a6',
      { context },
    );

    return context;
  }

  /**
   * Checks and returns the Identifier of the Client from the Query of the Request.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Identifier of the Client of the Request.
   */
  private getQueryClientId(parameters: PutQueryRegistrationRequest): string {
    this.logger.debug(`[${this.constructor.name}] Called getQueryClientId()`, 'eb3bb3f9-e0c3-462d-8342-f1595672f5c4', {
      parameters,
    });

    if (typeof parameters.client_id === 'undefined') {
      const exc = new InvalidClientMetadataException('Invalid parameter "client_id".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "client_id"`,
        'ef47fe3e-b83d-452a-8a7a-7b250b008d23',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.client_id;
  }

  /**
   * Checks and returns the Identifier of the Client from the Body of the Request.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Identifier of the Client of the Request.
   */
  private getBodyClientId(parameters: PutBodyRegistrationRequest): string {
    this.logger.debug(`[${this.constructor.name}] Called getBodyClientId()`, 'bd0072ca-ef76-436a-a844-161e00dc207e', {
      parameters,
    });

    if (typeof parameters.client_id !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "client_id".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "client_id"`,
        '24eded08-7ef3-4ac4-b63b-d800bf23e32d',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.client_id;
  }

  /**
   * Checks if the Client Identifiers match and returns the Query Identifier of the Client of the Request.
   *
   * @param queryClientId Identifier of the Client of the Request at the Query Parameters.
   * @param bodyClientId Identifier of the Client of the Request at the Body Parameters.
   * @returns Query Identifier of the Client of the Request.
   */
  private checkClientId(queryClientId: string, bodyClientId: string): string {
    this.logger.debug(`[${this.constructor.name}] Called checkClientId()`, 'aed84de0-e610-4f56-ac16-eaa949dafe2a', {
      query_client_id: queryClientId,
      body_client_id: bodyClientId,
    });

    const queryClientIdentifier = Buffer.from(queryClientId, 'utf8');
    const bodyClientIdentifier = Buffer.from(bodyClientId, 'utf8');

    if (
      queryClientIdentifier.length !== bodyClientIdentifier.length ||
      !timingSafeEqual(queryClientIdentifier, bodyClientIdentifier)
    ) {
      const exc = new InvalidClientMetadataException('Mismatching Client Identifiers.');

      this.logger.error(
        `[${this.constructor.name}] Mismatching Client Identifiers`,
        '8d69b95a-6513-4cbc-936b-1f4ab9f0b2e1',
        { query_client_id: queryClientId, body_client_id: bodyClientId },
        exc,
      );

      throw exc;
    }

    return queryClientId;
  }

  /**
   * Checks and returns the Secret of the Client of the Request.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Secret of the Client of the Request.
   */
  private getClientSecret(parameters: PutBodyRegistrationRequest): Nullable<string> {
    this.logger.debug(`[${this.constructor.name}] Called getClientSecret()`, 'dcc0c6f1-59c1-4cf9-813f-c41ce05bfd7b', {
      parameters,
    });

    if (typeof parameters.client_secret !== 'undefined' && typeof parameters.client_secret !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "client_secret".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "client_secret"`,
        'b7e862e8-14fd-4f4c-9770-421969f05647',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.client_secret ?? null;
  }

  /**
   * Checks if the Credentials provided by the Client match it's own data.
   *
   * @param client Client of the Put Registration Request.
   * @param clientSecret Secret of the Client of the Request.
   */
  private checkClientCredentials(client: Client, clientSecret: Nullable<string>): void {
    this.logger.debug(
      `[${this.constructor.name}] Called checkClientCredentials()`,
      '3a60013f-21f5-4c19-98be-bb4c4f1fda19',
      { client, client_secret: clientSecret },
    );

    if (client.secret === null || clientSecret === null) {
      return;
    }

    const secret = Buffer.from(client.secret, 'utf8');
    const providedSecret = Buffer.from(clientSecret, 'utf8');

    if (secret.length !== providedSecret.length || !timingSafeEqual(secret, providedSecret)) {
      const exc = new InvalidClientMetadataException('Mismatching Client Secret.');

      this.logger.error(
        `[${this.constructor.name}] Mismatching Client Secret`,
        '2cb742c4-a389-41c2-b349-eca2d5096a3b',
        null,
        exc,
      );

      throw exc;
    }
  }

  /**
   * Retrieves the Access Token from the Request and validates it.
   *
   * @param request Http Request.
   * @param clientId Identifier of the Client of the Request.
   * @returns Access Token based on the handle provided by the Client.
   */
  private async authorize(request: HttpRequest, clientId: string): Promise<AccessToken> {
    this.logger.debug(`[${this.constructor.name}] Called authorize()`, '8e41ec09-28ce-4b42-a901-211446669da2', {
      request,
    });

    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (accessToken.client === null) {
      const exc = new InvalidTokenException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] Cannot use a Registration Access Token`,
        '77a99028-79c2-41bb-a522-133cbb65da8f',
        { access_token: accessToken.handle },
        exc,
      );

      throw exc;
    }

    const clientIdentifier = Buffer.from(clientId, 'utf8');
    const accessTokenClientIdentifier = Buffer.from(accessToken.client!.id, 'utf8');

    if (
      clientIdentifier.length !== accessTokenClientIdentifier.length ||
      !timingSafeEqual(clientIdentifier, accessTokenClientIdentifier)
    ) {
      await this.accessTokenService.revoke(accessToken);
      const exc = new InsufficientScopeException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] The Client tried to use an Access Token not issued to itself`,
        '22f83017-9211-4552-b3ab-60b2b58d9e66',
        { client_id: clientId, access_token: accessToken.handle },
        exc,
      );

      throw exc;
    }

    if (accessToken.scopes.every((scope) => !this.expectedScopes.includes(scope))) {
      const exc = new InsufficientScopeException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] The Client tried to use an Access Token without the required scope`,
        'a5d36b0e-31d0-43b0-b1da-85b125521516',
        { access_token: accessToken.handle },
        exc,
      );

      throw exc;
    }

    return accessToken;
  }
}
