import { Inject, Injectable } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DeleteRegistrationContext } from '../context/registration/delete.registration.context';
import { GetRegistrationContext } from '../context/registration/get.registration.context';
import { PostRegistrationContext } from '../context/registration/post.registration.context';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { GetRegistrationResponse } from '../responses/registration/get.registration-response';
import { PostRegistrationResponse } from '../responses/registration/post.registration-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { RegistrationRequestValidator } from '../validators/registration-request.validator';
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
  readonly httpMethods: HttpMethod[] = ['DELETE', 'GET', 'POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Registration Endpoint.
   *
   * @param validator Instance of the Registration Request Validator.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly validator: RegistrationRequestValidator,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface
  ) {
    if (typeof clientService.create !== 'function') {
      throw new TypeError('Missing implementation of required method "ClientServiceInterface.create".');
    }

    if (typeof clientService.remove !== 'function') {
      throw new TypeError('Missing implementation of required method "ClientServiceInterface.remove".');
    }
  }

  /**
   * Routes the Dynamic Client Registration Request to the respective Response based on the Method of the Http Request.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      switch (request.method) {
        case 'DELETE':
          return await this.handleDelete(request);

        case 'GET':
          return await this.handleGet(request);

        case 'POST':
          return await this.handlePost(request);

        case 'PUT':
          return null!;
      }
    } catch (exc: unknown) {
      let error: OAuth2Exception;

      if (exc instanceof OAuth2Exception) {
        error = exc;
      } else {
        error = new ServerErrorException({ description: 'An unexpected error occurred.' });
        error.cause = exc;
      }

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(error.toJSON());
    }
  }

  /**
   * Creates a Http JSON Dynamic Client Registration Response.
   *
   * This method is responsible for receiving a set of OAuth 2.0 Client Metadata from a developer
   * and registering it as a new OAuth 2.0 Client in the Authorization Server.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  private async handlePost(request: HttpRequest): Promise<HttpResponse> {
    try {
      const context = await this.validator.validatePost(request);
      const registrationResponse = await this.registerClient(context);

      return new HttpResponse().setHeaders(this.headers).json(registrationResponse);
    } catch (exc: unknown) {
      let error: OAuth2Exception;

      if (exc instanceof OAuth2Exception) {
        error = exc;
      } else {
        error = new ServerErrorException({ description: 'An unexpected error occurred.' });
        error.cause = exc;
      }

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(error.toJSON());
    }
  }

  /**
   * Creates a Http JSON Dynamic Client Registration Response.
   *
   * This method is responsible for returning the Metadata of the Client.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  private async handleGet(request: HttpRequest): Promise<HttpResponse> {
    try {
      const context = await this.validator.validateGet(request);
      const registrationResponse = await this.getClientMetadata(context);

      return new HttpResponse().setHeaders(this.headers).json(registrationResponse);
    } catch (exc: unknown) {
      let error: OAuth2Exception;

      if (exc instanceof OAuth2Exception) {
        error = exc;
      } else {
        error = new ServerErrorException({ description: 'An unexpected error occurred.' });
        error.cause = exc;
      }

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(error.toJSON());
    }
  }

  /**
   * Creates a Http JSON Dynamic Client Registration Response.
   *
   * This method is responsible for decomissioning the Client from the Authorization Server.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  private async handleDelete(request: HttpRequest): Promise<HttpResponse> {
    try {
      const context = await this.validator.validateDelete(request);
      await this.decomissionClient(context);

      return new HttpResponse().setStatus(204).setHeaders(this.headers);
    } catch (exc: unknown) {
      let error: OAuth2Exception;

      if (exc instanceof OAuth2Exception) {
        error = exc;
      } else {
        error = new ServerErrorException({ description: 'An unexpected error occurred.' });
        error.cause = exc;
      }

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(error.toJSON());
    }
  }

  /**
   * Creates a new Client based on the provided parameters and returns it's Metadata.
   *
   * @param context Parameters of the Dynamic Client Registration Context.
   * @returns Metadata of the newly registered Client.
   */
  private async registerClient(context: PostRegistrationContext): Promise<PostRegistrationResponse> {
    const client = await this.clientService.create!(context);
    const registrationAccessToken = await this.accessTokenService.create(this.validator.getRequestScopes, client);

    const registrationClientUri = new URL(this.path, this.settings.issuer);

    registrationClientUri.searchParams.set('client_id', client.id);

    return removeUndefined<PostRegistrationResponse>({
      client_id: client.id,
      client_secret: client.secret ?? undefined,
      client_id_issued_at:
        client.secretIssuedAt != null ? Math.floor(client.secretIssuedAt.getTime() / 1000) : undefined,
      client_secret_expires_at:
        client.secret != null
          ? client.secretExpiresAt != null
            ? Math.floor(client.secretExpiresAt.getTime() / 1000)
            : 0
          : undefined,
      registration_access_token: registrationAccessToken.handle,
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
      // sector_identifier_uri: ,
      // subject_type: ,
      id_token_signed_response_alg: client.idTokenSignedResponseAlgorithm ?? undefined,
      // id_token_encrypted_response_alg: ,
      // id_token_encrypted_response_enc: ,
      // userinfo_signed_response_alg: ,
      // userinfo_encrypted_response_alg: ,
      // userinfo_encrypted_response_enc: ,
      // request_object_signing_alg: ,
      // request_object_encryption_alg: ,
      // request_object_encryption_enc: ,
      token_endpoint_auth_method: client.authenticationMethod,
      token_endpoint_auth_signing_alg: client.authenticationSigningAlgorithm,
      default_max_age: client.defaultMaxAge ?? undefined,
      require_auth_time: client.requireAuthTime,
      default_acr_values: client.defaultAcrValues ?? undefined,
      initiate_login_uri: client.initiateLoginUri ?? undefined,
      // request_uris: ,
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

    return removeUndefined<GetRegistrationResponse>({
      client_id: client.id,
      client_secret: client.secret ?? undefined,
      client_id_issued_at:
        client.secretIssuedAt != null ? Math.floor(client.secretIssuedAt.getTime() / 1000) : undefined,
      client_secret_expires_at:
        client.secret != null
          ? client.secretExpiresAt != null
            ? Math.floor(client.secretExpiresAt.getTime() / 1000)
            : 0
          : undefined,
      registration_access_token: context.accessToken.handle,
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
      // sector_identifier_uri: ,
      // subject_type: ,
      id_token_signed_response_alg: client.idTokenSignedResponseAlgorithm ?? undefined,
      // id_token_encrypted_response_alg: ,
      // id_token_encrypted_response_enc: ,
      // userinfo_signed_response_alg: ,
      // userinfo_encrypted_response_alg: ,
      // userinfo_encrypted_response_enc: ,
      // request_object_signing_alg: ,
      // request_object_encryption_alg: ,
      // request_object_encryption_enc: ,
      token_endpoint_auth_method: client.authenticationMethod,
      token_endpoint_auth_signing_alg: client.authenticationSigningAlgorithm,
      default_max_age: client.defaultMaxAge ?? undefined,
      require_auth_time: client.requireAuthTime,
      default_acr_values: client.defaultAcrValues ?? undefined,
      initiate_login_uri: client.initiateLoginUri ?? undefined,
      // request_uris: ,
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
  }
}
