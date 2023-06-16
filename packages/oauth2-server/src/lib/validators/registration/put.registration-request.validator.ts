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
   * @param scopeHandler Instance of the Scope Handler.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    protected override readonly scopeHandler: ScopeHandler,
    protected override readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    @Inject(ACCESS_TOKEN_SERVICE) protected override readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(SETTINGS) protected override readonly settings: Settings
  ) {
    super(scopeHandler, clientAuthorizationHandler, accessTokenService, settings);
  }

  /**
   * Validates the Registration Request and returns the actors of the Registration Context.
   *
   * @param request Http Request.
   * @returns Dynamic Client Registration Context.
   */
  public override async validate(request: HttpRequest): Promise<PutRegistrationContext> {
    const queryParameters = request.query as PutQueryRegistrationRequest;
    const bodyParameters = request.json<PutBodyRegistrationRequest>();

    if (!isPlainObject(bodyParameters)) {
      throw new InvalidRequestException('Invalid Http Request Body.');
    }

    const queryClientId = this.getQueryClientId(queryParameters);
    const bodyClientId = this.getBodyClientId(bodyParameters);

    const clientId = this.checkClientId(queryClientId, bodyClientId);
    const clientSecret = this.getClientSecret(bodyParameters);

    const accessToken = await this.authorize(request, clientId);

    this.checkClientCredentials(accessToken.client!, clientSecret);

    const context = await super.validate(request);

    return Object.assign<PutRegistrationContext, Partial<PutRegistrationContext>>(context, {
      queryParameters,
      bodyParameters,
      accessToken,
      client: accessToken.client!,
      clientId,
      clientSecret,
    }) as PutRegistrationContext;
  }

  /**
   * Checks and returns the Identifier of the Client from the Query of the Request.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Identifier of the Client of the Request.
   */
  private getQueryClientId(parameters: PutQueryRegistrationRequest): string {
    if (typeof parameters.client_id === 'undefined') {
      throw new InvalidClientMetadataException('Invalid parameter "client_id".');
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
    if (typeof parameters.client_id !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "client_id".');
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
    const queryClientIdentifier = Buffer.from(queryClientId, 'utf8');
    const bodyClientIdentifier = Buffer.from(bodyClientId, 'utf8');

    if (
      queryClientIdentifier.length !== bodyClientIdentifier.length ||
      !timingSafeEqual(queryClientIdentifier, bodyClientIdentifier)
    ) {
      throw new InvalidClientMetadataException('Mismatching Client Identifiers.');
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
    if (typeof parameters.client_secret !== 'undefined' && typeof parameters.client_secret !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "client_secret".');
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
    if (client.secret === null || clientSecret === null) {
      return;
    }

    const secret = Buffer.from(client.secret, 'utf8');
    const providedSecret = Buffer.from(clientSecret, 'utf8');

    if (secret.length !== providedSecret.length || !timingSafeEqual(secret, providedSecret)) {
      throw new InvalidClientMetadataException('Mismatching Client Secret.');
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
    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (accessToken.client === null) {
      throw new InvalidTokenException('Invalid Credentials.');
    }

    const clientIdentifier = Buffer.from(clientId, 'utf8');
    const accessTokenClientIdentifier = Buffer.from(accessToken.client!.id, 'utf8');

    if (
      clientIdentifier.length !== accessTokenClientIdentifier.length ||
      !timingSafeEqual(clientIdentifier, accessTokenClientIdentifier)
    ) {
      await this.accessTokenService.revoke(accessToken);
      throw new InsufficientScopeException('Invalid Credentials.');
    }

    if (accessToken.scopes.every((scope) => !this.expectedScopes.includes(scope))) {
      throw new InsufficientScopeException('Invalid Credentials.');
    }

    return accessToken;
  }
}
