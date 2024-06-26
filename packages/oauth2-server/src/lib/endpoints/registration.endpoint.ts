import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { Inject, Injectable, InjectAll } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { DeleteRegistrationContext } from '../context/registration/delete.registration-context';
import { GetRegistrationContext } from '../context/registration/get.registration-context';
import { PostRegistrationContext } from '../context/registration/post.registration-context';
import { PutRegistrationContext } from '../context/registration/put.registration-context';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { GetRegistrationResponse } from '../responses/registration/get.registration-response';
import { PostRegistrationResponse } from '../responses/registration/post.registration-response';
import { PutRegistrationResponse } from '../responses/registration/put.registration-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { RegistrationRequestValidator } from '../validators/registration/registration-request.validator';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Dynamic Client Registration** Endpoint.
 *
 * This endpoint is responsible for registering new Clients to the Authorization Server.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7591.html
 * @see https://openid.net/specs/openid-connect-registration-1_0.html
 */
@Injectable()
export class RegistrationEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  readonly name: Endpoint = 'registration';

  /**
   * Path of the Endpoint.
   */
  readonly path: string = '/oauth/register';

  /**
   * Http Methods supported by the Endpoint.
   */
  readonly httpMethods: HttpMethod[] = ['DELETE', 'GET', 'POST', 'PUT'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Registration Endpoint.
   *
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param accessTokenService Instance of the Access Token Service.
   * @param validators Registration Request Validators registered at the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @InjectAll(RegistrationRequestValidator) private readonly validators: RegistrationRequestValidator[],
  ) {
    if (typeof clientService.create !== 'function') {
      const exc = new TypeError('Missing implementation of required method "ClientServiceInterface.create".');

      this.logger.critical(
        `[${this.constructor.name}] Missing implementation of required method "ClientServiceInterface.create"`,
        '10235c15-2290-4181-8270-efe86d7cd0ae',
        null,
        exc,
      );

      throw exc;
    }

    if (typeof clientService.remove !== 'function') {
      const exc = new TypeError('Missing implementation of required method "ClientServiceInterface.remove".');

      this.logger.critical(
        `[${this.constructor.name}] Missing implementation of required method "ClientServiceInterface.remove"`,
        '8c0a7eba-4ea3-478e-8558-f9b963f89854',
        null,
        exc,
      );

      throw exc;
    }

    if (typeof clientService.update !== 'function') {
      const exc = new TypeError('Missing implementation of required method "ClientServiceInterface.update".');

      this.logger.critical(
        `[${this.constructor.name}] Missing implementation of required method "ClientServiceInterface.update"`,
        '98e89835-64c2-40e5-893b-684d20d18610',
        null,
        exc,
      );

      throw exc;
    }

    if (typeof accessTokenService.createRegistrationAccessToken !== 'function') {
      const exc = new TypeError(
        'Missing implementation of required method "AccessTokenServiceInterface.createRegistrationAccessToken".',
      );

      this.logger.critical(
        `[${this.constructor.name}] Missing implementation of required method "AccessTokenServiceInterface.createRegistrationAccessToken"`,
        'e45b8a68-ee9e-4e9b-90b5-a234f9066d04',
        null,
        exc,
      );

      throw exc;
    }
  }

  /**
   * Routes the Dynamic Client Registration Request to the respective Response based on the Method of the Http Request.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '8cf97f47-22c1-48c7-ab7b-204c5fb7ef9f', {
      request,
    });

    try {
      const validator = this.getValidator(request);
      const context = await validator.validate(request);

      switch (request.method) {
        case 'DELETE':
          return await this.handleDelete(context as DeleteRegistrationContext);

        case 'GET':
          return await this.handleGet(context as GetRegistrationContext);

        case 'POST':
          return await this.handlePost(context as PostRegistrationContext);

        case 'PUT':
          return await this.handlePut(context as PutRegistrationContext);
      }
    } catch (exc: unknown) {
      const error =
        exc instanceof OAuth2Exception
          ? exc
          : new ServerErrorException('An unexpected error occurred.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Error on Registration Endpoint`,
        '73f3ffbb-c86b-49dd-90ed-adb8cce79c46',
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
   * Retrieves the Authorization Request Validator based on the Response Type requested by the Client.
   *
   * @param request Http Request.
   * @returns Authorization Request Validator.
   */
  private getValidator(request: HttpRequest): RegistrationRequestValidator {
    this.logger.debug(`[${this.constructor.name}] Called getValidator()`, '52fdf8cb-1cba-4de5-85c5-2f3e983cf05d', {
      request,
    });

    return this.validators.find((validator) => validator.httpMethod === request.method)!;
  }

  /**
   * Creates a Http JSON Dynamic Client Registration Response.
   *
   * This method is responsible for decomissioning the Client from the Authorization Server.
   *
   * @param context Dynamic Client Registration Delete Context.
   * @returns Http Response.
   */
  private async handleDelete(context: DeleteRegistrationContext): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleDelete()`, '96bbf309-8d1e-4fe9-afb9-fd8a1041301a', {
      context,
    });

    await this.decomissionClient(context);

    const response = new HttpResponse().setStatus(204).setHeaders(this.headers);

    this.logger.debug(
      `[${this.constructor.name}] Client Decomission completed`,
      '5d2d8613-5b70-4e1f-b468-618ebd9386ab',
      { response },
    );

    return response;
  }

  /**
   * Creates a Http JSON Dynamic Client Registration Response.
   *
   * This method is responsible for returning the Metadata of the Client.
   *
   * @param context Dynamic Client Registration Get Context.
   * @returns Http Response.
   */
  private async handleGet(context: GetRegistrationContext): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleGet()`, '9e9f1c57-1ec2-4c48-b012-01755964d23c', {
      context,
    });

    const registrationResponse = await this.getClientMetadata(context);
    const response = new HttpResponse().setHeaders(this.headers).json(registrationResponse);

    this.logger.debug(`[${this.constructor.name}] Client Fetch completed`, '55e3ab3b-d18e-4ebd-8a32-db139c95aa51', {
      response,
    });

    return response;
  }

  /**
   * Creates a Http JSON Dynamic Client Registration Response.
   *
   * This method is responsible for receiving a set of OAuth 2.0 Client Metadata from a developer
   * and registering it as a new OAuth 2.0 Client in the Authorization Server.
   *
   * @param context Dynamic Client Registration Post Context.
   * @returns Http Response.
   */
  private async handlePost(context: PostRegistrationContext): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handlePost()`, '46ac4a3d-e3ca-4ea2-9d14-a8befc730944', {
      context,
    });

    const registrationResponse = await this.registerClient(context);
    const response = new HttpResponse().setStatus(201).setHeaders(this.headers).json(registrationResponse);

    this.logger.debug(`[${this.constructor.name}] Client Creation completed`, 'e12f3347-62f6-4b97-bb80-0f4182d5b1d2', {
      response,
    });

    return response;
  }

  /**
   * Creates a Http JSON Dynamic Client Registration Response.
   *
   * This method is responsible for updating the metadata of the Client.
   *
   * @param context Dynamic Client Registration Put Context.
   * @returns Http Response.
   */
  private async handlePut(context: PutRegistrationContext): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handlePut()`, '8351d3a3-2f76-4ea2-b6cc-6fef10670f5f', {
      context,
    });

    const registrationResponse = await this.updateMetadata(context);
    const response = new HttpResponse().setHeaders(this.headers).json(registrationResponse);

    this.logger.debug(`[${this.constructor.name}] Client Update completed`, '27bc8771-6c49-4ba2-bd88-93cb2bbab6f8', {
      response,
    });

    return response;
  }

  /**
   * Creates a new Client based on the provided parameters and returns it's Metadata.
   *
   * @param context Parameters of the Dynamic Client Registration Context.
   * @returns Metadata of the newly registered Client.
   */
  private async registerClient(context: PostRegistrationContext): Promise<PostRegistrationResponse> {
    const client = await this.clientService.create!(context);
    const registrationAccessToken = await this.accessTokenService.createRegistrationAccessToken!(client);

    await this.accessTokenService.revoke(context.accessToken);

    const registrationClientUri = new URL(this.path, this.settings.issuer);

    registrationClientUri.searchParams.set('client_id', client.id);

    return removeNullishValues<PostRegistrationResponse>({
      client_id: client.id,
      client_secret: client.secret ?? undefined,
      client_id_issued_at: client.secret !== null ? Math.floor(client.createdAt.getTime() / 1000) : undefined,
      client_secret_expires_at:
        client.secret !== null
          ? client.secretExpiresAt !== null
            ? Math.floor(client.secretExpiresAt.getTime() / 1000)
            : 0
          : undefined,
      registration_access_token: registrationAccessToken.id,
      registration_client_uri: registrationClientUri.href,
      redirect_uris: client.redirectUris,
      response_types: client.responseTypes,
      grant_types: client.grantTypes,
      application_type: client.applicationType,
      client_name: client.name,
      scope: client.scopes.join(' '),
      contacts: client.contacts ?? undefined,
      logo_uri: client.logoUri ?? undefined,
      client_uri: client.clientUri ?? undefined,
      policy_uri: client.policyUri ?? undefined,
      tos_uri: client.tosUri ?? undefined,
      jwks_uri: client.jwksUri ?? undefined,
      jwks: client.jwks ?? undefined,
      subject_type: client.subjectType,
      sector_identifier_uri: client.sectorIdentifierUri?.toString(),
      id_token_signed_response_alg: client.idTokenSignedResponseAlgorithm,
      id_token_encrypted_response_alg: client.idTokenEncryptedResponseKeyWrap ?? undefined,
      id_token_encrypted_response_enc: client.idTokenEncryptedResponseContentEncryption ?? undefined,
      userinfo_signed_response_alg: client.userinfoSignedResponseAlgorithm ?? undefined,
      userinfo_encrypted_response_alg: client.userinfoEncryptedResponseKeyWrap ?? undefined,
      userinfo_encrypted_response_enc: client.userinfoEncryptedResponseContentEncryption ?? undefined,
      // request_object_signing_alg: ,
      // request_object_encryption_alg: ,
      // request_object_encryption_enc: ,
      authorization_signed_response_alg: client.authorizationSignedResponseAlgorithm ?? undefined,
      authorization_encrypted_response_alg: client.authorizationEncryptedResponseKeyWrap ?? undefined,
      authorization_encrypted_response_enc: client.authorizationEncryptedResponseContentEncryption ?? undefined,
      token_endpoint_auth_method: client.authenticationMethod,
      token_endpoint_auth_signing_alg: client.authenticationSigningAlgorithm ?? undefined,
      default_max_age: client.defaultMaxAge ?? undefined,
      require_auth_time: client.requireAuthTime,
      default_acr_values: client.defaultAcrValues ?? undefined,
      initiate_login_uri: client.initiateLoginUri ?? undefined,
      // request_uris: ,
      post_logout_redirect_uris: client.postLogoutRedirectUris ?? undefined,
      backchannel_logout_uri: client.backChannelLogoutUri ?? undefined,
      backchannel_logout_session_required: client.backChannelLogoutSessionRequired ?? undefined,
      software_id: client.softwareId ?? undefined,
      software_version: client.softwareVersion ?? undefined,
    });
  }

  /**
   * Returns the Metadata of the Client of the Request.
   *
   * @param context Parameters of the Dynamic Client Registration Context.
   * @returns Metadata of the Client.
   */
  private async getClientMetadata(context: GetRegistrationContext): Promise<GetRegistrationResponse> {
    const { client } = context;

    const registrationClientUri = new URL(this.path, this.settings.issuer);

    registrationClientUri.searchParams.set('client_id', client.id);

    return removeNullishValues<GetRegistrationResponse>({
      client_id: client.id,
      client_secret: client.secret ?? undefined,
      client_secret_expires_at:
        client.secret !== null
          ? client.secretExpiresAt !== null
            ? Math.floor(client.secretExpiresAt.getTime() / 1000)
            : 0
          : undefined,
      registration_access_token: context.accessToken.id,
      registration_client_uri: registrationClientUri.href,
      redirect_uris: client.redirectUris,
      response_types: client.responseTypes,
      grant_types: client.grantTypes,
      application_type: client.applicationType,
      client_name: client.name,
      scope: client.scopes.join(' '),
      contacts: client.contacts ?? undefined,
      logo_uri: client.logoUri ?? undefined,
      client_uri: client.clientUri ?? undefined,
      policy_uri: client.policyUri ?? undefined,
      tos_uri: client.tosUri ?? undefined,
      jwks_uri: client.jwksUri ?? undefined,
      jwks: client.jwks ?? undefined,
      subject_type: client.subjectType,
      sector_identifier_uri: client.sectorIdentifierUri?.toString(),
      id_token_signed_response_alg: client.idTokenSignedResponseAlgorithm ?? undefined,
      id_token_encrypted_response_alg: client.idTokenEncryptedResponseKeyWrap ?? undefined,
      id_token_encrypted_response_enc: client.idTokenEncryptedResponseContentEncryption ?? undefined,
      userinfo_signed_response_alg: client.userinfoSignedResponseAlgorithm ?? undefined,
      userinfo_encrypted_response_alg: client.userinfoEncryptedResponseKeyWrap ?? undefined,
      userinfo_encrypted_response_enc: client.userinfoEncryptedResponseContentEncryption ?? undefined,
      // request_object_signing_alg: ,
      // request_object_encryption_alg: ,
      // request_object_encryption_enc: ,
      authorization_signed_response_alg: client.authorizationSignedResponseAlgorithm ?? undefined,
      authorization_encrypted_response_alg: client.authorizationEncryptedResponseKeyWrap ?? undefined,
      authorization_encrypted_response_enc: client.authorizationEncryptedResponseContentEncryption ?? undefined,
      token_endpoint_auth_method: client.authenticationMethod,
      token_endpoint_auth_signing_alg: client.authenticationSigningAlgorithm ?? undefined,
      default_max_age: client.defaultMaxAge ?? undefined,
      require_auth_time: client.requireAuthTime,
      default_acr_values: client.defaultAcrValues ?? undefined,
      initiate_login_uri: client.initiateLoginUri ?? undefined,
      // request_uris: ,
      post_logout_redirect_uris: client.postLogoutRedirectUris ?? undefined,
      backchannel_logout_uri: client.backChannelLogoutUri ?? undefined,
      backchannel_logout_session_required: client.backChannelLogoutSessionRequired ?? undefined,
      software_id: client.softwareId ?? undefined,
      software_version: client.softwareVersion ?? undefined,
    });
  }

  /**
   * Decomissions the Client from the Authorization Server.
   *
   * @param context Parameters of the Dynamic Client Registration Context.
   */
  private async decomissionClient(context: DeleteRegistrationContext): Promise<void> {
    await this.clientService.remove!(context.client);
    await this.accessTokenService.revoke(context.accessToken);
  }

  /**
   * Updates the Metadata of the Client based on the provided parameters and returns it.
   *
   * @param context Parameters of the Dynamic Client Registration Context.
   * @returns Updated Metadata of the Client.
   */
  private async updateMetadata(context: PutRegistrationContext): Promise<PutRegistrationResponse> {
    const { client } = context;

    await this.clientService.update!(client, context);

    const registrationClientUri = new URL(this.path, this.settings.issuer);

    registrationClientUri.searchParams.set('client_id', client.id);

    return removeNullishValues<PutRegistrationResponse>({
      client_id: client.id,
      client_secret: client.secret ?? undefined,
      client_secret_expires_at:
        client.secret !== null
          ? client.secretExpiresAt !== null
            ? Math.floor(client.secretExpiresAt.getTime() / 1000)
            : 0
          : undefined,
      registration_access_token: context.accessToken.id,
      registration_client_uri: registrationClientUri.href,
      redirect_uris: client.redirectUris,
      response_types: client.responseTypes,
      grant_types: client.grantTypes,
      application_type: client.applicationType,
      client_name: client.name,
      scope: client.scopes.join(' '),
      contacts: client.contacts ?? undefined,
      logo_uri: client.logoUri ?? undefined,
      client_uri: client.clientUri ?? undefined,
      policy_uri: client.policyUri ?? undefined,
      tos_uri: client.tosUri ?? undefined,
      jwks_uri: client.jwksUri ?? undefined,
      jwks: client.jwks ?? undefined,
      subject_type: client.subjectType,
      sector_identifier_uri: client.sectorIdentifierUri?.toString(),
      id_token_signed_response_alg: client.idTokenSignedResponseAlgorithm ?? undefined,
      id_token_encrypted_response_alg: client.idTokenEncryptedResponseKeyWrap ?? undefined,
      id_token_encrypted_response_enc: client.idTokenEncryptedResponseContentEncryption ?? undefined,
      userinfo_signed_response_alg: client.userinfoSignedResponseAlgorithm ?? undefined,
      userinfo_encrypted_response_alg: client.userinfoEncryptedResponseKeyWrap ?? undefined,
      userinfo_encrypted_response_enc: client.userinfoEncryptedResponseContentEncryption ?? undefined,
      // request_object_signing_alg: ,
      // request_object_encryption_alg: ,
      // request_object_encryption_enc: ,
      authorization_signed_response_alg: client.authorizationSignedResponseAlgorithm ?? undefined,
      authorization_encrypted_response_alg: client.authorizationEncryptedResponseKeyWrap ?? undefined,
      authorization_encrypted_response_enc: client.authorizationEncryptedResponseContentEncryption ?? undefined,
      token_endpoint_auth_method: client.authenticationMethod,
      token_endpoint_auth_signing_alg: client.authenticationSigningAlgorithm ?? undefined,
      default_max_age: client.defaultMaxAge ?? undefined,
      require_auth_time: client.requireAuthTime,
      default_acr_values: client.defaultAcrValues ?? undefined,
      initiate_login_uri: client.initiateLoginUri ?? undefined,
      // request_uris: ,
      post_logout_redirect_uris: client.postLogoutRedirectUris ?? undefined,
      backchannel_logout_uri: client.backChannelLogoutUri ?? undefined,
      backchannel_logout_session_required: client.backChannelLogoutSessionRequired ?? undefined,
      software_id: client.softwareId ?? undefined,
      software_version: client.softwareVersion ?? undefined,
    });
  }
}
