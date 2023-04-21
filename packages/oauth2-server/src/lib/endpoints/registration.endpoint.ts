import { Inject, Injectable } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { RegistrationContext } from '../context/registration.context';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { RegistrationRequest } from '../requests/registration-request';
import { RegistrationResponse } from '../responses/registration-response';
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
  readonly httpMethods: HttpMethod[] = ['POST'];

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
   */
  public constructor(
    private readonly validator: RegistrationRequestValidator,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface
  ) {
    if (typeof clientService.create !== 'function') {
      throw new TypeError('Missing implementation of required method "ClientServiceInterface.create".');
    }
  }

  /**
   * Creates a Http JSON Dynamic Client Registration Response.
   *
   * This endpoint is responsible for receiving a set of OAuth 2.0 Client Metadata from a developer
   * and register it as a new OAuth 2.0 Client in the Authorization Server.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest<RegistrationRequest>): Promise<HttpResponse> {
    try {
      const context = await this.validator.validate(request);
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
   * Creates a new Client based on the provided parameters and returns it's Metadata.
   *
   * @param context Parameters of the Dynamic Client Registration Context.
   * @returns Metadata of the newly registered Client.
   */
  private async registerClient(context: RegistrationContext): Promise<RegistrationResponse> {
    const client = await this.clientService.create!(context);

    const registrationClientUri = new URL(this.path, this.settings.issuer);

    registrationClientUri.searchParams.set('client_id', client.id);

    return removeUndefined<RegistrationResponse>({
      client_id: client.id,
      client_secret: client.secret ?? undefined,
      client_id_issued_at:
        client.secretIssuedAt != null ? Math.floor(client.secretIssuedAt.getTime() / 1000) : undefined,
      client_secret_expires_at:
        client.secretExpiresAt != null ? Math.floor(client.secretExpiresAt.getTime() / 1000) : undefined,
      registration_access_token: client.registrationAccessToken,
      registration_client_uri: registrationClientUri.href,
      redirect_uris: context.redirectUris.map((redirectUri) => redirectUri.href),
      response_types: context.responseTypes,
      grant_types: context.grantTypes,
      application_type: context.applicationType,
      client_name: context.clientName,
      scope: context.scopes.join(' '),
      contacts: context.contacts,
      logo_uri: context.logoUri?.href,
      client_uri: context.clientUri?.href,
      policy_uri: context.policyUri?.href,
      tos_uri: context.tosUri?.href,
      jwks_uri: context.jwksUri?.href,
      jwks: context.jwks,
      // sector_identifier_uri: ,
      // subject_type: ,
      id_token_signed_response_alg: context.idTokenSignedResponseAlgorithm,
      // id_token_encrypted_response_alg: ,
      // id_token_encrypted_response_enc: ,
      // userinfo_signed_response_alg: ,
      // userinfo_encrypted_response_alg: ,
      // userinfo_encrypted_response_enc: ,
      // request_object_signing_alg: ,
      // request_object_encryption_alg: ,
      // request_object_encryption_enc: ,
      token_endpoint_auth_method: context.authenticationMethod,
      token_endpoint_auth_signing_alg: context.authenticationSigningAlgorithm,
      default_max_age: context.defaultMaxAge,
      require_auth_time: context.requireAuthTime,
      default_acr_values: context.defaultAcrValues,
      initiate_login_uri: context.initiateLoginUri?.href,
      // request_uris: ,
      software_id: context.softwareId,
      software_version: context.softwareVersion,
    });
  }
}
