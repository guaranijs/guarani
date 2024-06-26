import { URL } from 'url';

import { DependencyInjectionContainer, Inject, Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { DiscoveryResponse } from '../responses/discovery-response';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { EndpointInterface } from './endpoint.interface';
import { ENDPOINT } from './endpoint.token';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Discovery** Endpoint.
 *
 * This endpoint is used to provide the Metadata of the Authorization Server to the Client.
 *
 * @see https://www.rfc-editor.org/rfc/rfc8414.html
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html
 */
@Injectable()
export class DiscoveryEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'discovery';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/.well-known/openid-configuration';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['GET'];

  /**
   * Instantiates a new Discovery Endpoint.
   *
   * @param container Instance of the Dependency Injection Container.
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly container: DependencyInjectionContainer,
    private readonly logger: Logger,
    @Inject(SETTINGS) private readonly settings: Settings,
  ) {}

  /**
   * Creates an OpenID Connect Discovery Response.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '2ee12df9-558e-4f06-87da-653ad3fe546c', {
      request,
    });

    const discoveryResponse = removeNullishValues<DiscoveryResponse>({
      issuer: this.settings.issuer,
      authorization_endpoint: this.getEndpointPath('authorization'),
      token_endpoint: this.getEndpointPath('token'),
      userinfo_endpoint: this.getEndpointPath('userinfo'),
      jwks_uri: this.getEndpointPath('jwks'),
      registration_endpoint: this.getEndpointPath('registration'),
      scopes_supported: this.settings.scopes,
      response_types_supported: this.settings.responseTypes,
      response_modes_supported: this.settings.responseModes,
      grant_types_supported: this.settings.grantTypes,
      acr_values_supported: this.settings.acrValues,
      subject_types_supported: this.settings.subjectTypes,
      id_token_signing_alg_values_supported: this.settings.idTokenSignatureAlgorithms,
      id_token_encryption_alg_values_supported: this.settings.idTokenKeyWrapAlgorithms,
      id_token_encryption_enc_values_supported: this.settings.idTokenContentEncryptionAlgorithms,
      userinfo_signing_alg_values_supported: this.settings.userinfoSignatureAlgorithms,
      userinfo_encryption_alg_values_supported: this.settings.userinfoKeyWrapAlgorithms,
      userinfo_encryption_enc_values_supported: this.settings.userinfoContentEncryptionAlgorithms,
      authorization_signing_alg_values_supported: this.settings.authorizationSignatureAlgorithms,
      authorization_encryption_alg_values_supported: this.settings.authorizationKeyWrapAlgorithms,
      authorization_encryption_enc_values_supported: this.settings.authorizationContentEncryptionAlgorithms,
      prompt_values_supported: ['consent', 'create', 'login', 'none', 'select_account'],
      display_values_supported: this.settings.displays,
      token_endpoint_auth_methods_supported: this.settings.clientAuthenticationMethods,
      token_endpoint_auth_signing_alg_values_supported: this.settings.clientAuthenticationSignatureAlgorithms,
      service_documentation: undefined,
      ui_locales_supported: this.settings.uiLocales,
      op_policy_uri: undefined,
      op_tos_uri: undefined,
      revocation_endpoint: this.getEndpointPath('revocation'),
      revocation_endpoint_auth_methods_supported: this.settings.clientAuthenticationMethods,
      revocation_endpoint_auth_signing_alg_values_supported: this.settings.clientAuthenticationSignatureAlgorithms,
      introspection_endpoint: this.getEndpointPath('introspection'),
      introspection_endpoint_auth_methods_supported: this.settings.clientAuthenticationMethods,
      introspection_endpoint_auth_signing_alg_values_supported: this.settings.clientAuthenticationSignatureAlgorithms,
      code_challenge_methods_supported: this.settings.pkces,
      interaction_endpoint: this.getEndpointPath('interaction'),
      device_authorization_endpoint: this.getEndpointPath('device_authorization'),
      end_session_endpoint: this.getEndpointPath('end_session'),
      authorization_response_iss_parameter_supported: this.settings.enableAuthorizationResponseIssuerIdentifier,
      backchannel_logout_supported: this.settings.enableBackChannelLogout,
      backchannel_logout_session_supported: this.settings.includeSessionIdInLogoutToken,
    });

    const response = new HttpResponse().json(discoveryResponse);

    this.logger.debug(`[${this.constructor.name}] Discovery completed`, '4dd280ba-7bfe-43a5-82da-74610a263c7d', {
      response,
    });

    return response;
  }

  /**
   * Returns the full url path of the provided endpoint.
   *
   * @param name Name of the Endpoint.
   * @returns Full Url of the Endpoint.
   */
  private getEndpointPath(name: Endpoint): string | undefined {
    const endpoint = this.container.resolveAll<EndpointInterface>(ENDPOINT).find((endpoint) => endpoint.name === name);

    if (typeof endpoint === 'undefined') {
      return undefined;
    }

    return new URL(endpoint.path, this.settings.issuer).href;
  }
}
