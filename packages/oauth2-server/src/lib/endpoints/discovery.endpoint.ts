import { getContainer, Inject, Injectable } from '@guarani/di';

import { URL } from 'url';

import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { DiscoveryResponse } from '../messages/discovery-response';
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
   * @param settings Settings of the Authorization Server.
   */
  public constructor(@Inject(SETTINGS) private readonly settings: Settings) {}

  // @ts-expect-error Unused variable "request"
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const discoveryResponse = <DiscoveryResponse>{
      issuer: this.settings.issuer,
      authorization_endpoint: this.getEndpointPath('authorization'),
      token_endpoint: this.getEndpointPath('token'),
      jwks_uri: this.getEndpointPath('jwks'),
      scopes_supported: this.settings.scopes,
      response_types_supported: this.settings.responseTypes,
      response_modes_supported: this.settings.responseModes,
      grant_types_supported: this.settings.grantTypes,
      token_endpoint_auth_methods_supported: this.settings.clientAuthenticationMethods,
      token_endpoint_auth_signing_alg_values_supported: this.settings.clientAuthenticationSignatureAlgorithms,
      service_documentation: undefined,
      ui_locales_supported: undefined,
      op_policy_uri: undefined,
      op_tos_uri: undefined,
      revocation_endpoint: this.getEndpointPath('revocation'),
      revocation_endpoint_auth_methods_supported: this.settings.clientAuthenticationMethods,
      revocation_endpoint_auth_signing_alg_values_supported: this.settings.clientAuthenticationSignatureAlgorithms,
      introspection_endpoint: this.getEndpointPath('introspection'),
      introspection_endpoint_auth_methods_supported: this.settings.clientAuthenticationMethods,
      introspection_endpoint_auth_signing_alg_values_supported: this.settings.clientAuthenticationSignatureAlgorithms,
      code_challenge_methods_supported: this.settings.pkceMethods,
      interaction_endpoint: this.getEndpointPath('interaction'),
    };

    return new HttpResponse().json(discoveryResponse);
  }

  private getEndpointPath(name: Endpoint): string | undefined {
    const endpoints = getContainer('oauth2').resolveAll<EndpointInterface>(ENDPOINT);
    const path = endpoints.find((endpoint) => endpoint.name === name)?.path;

    if (path === undefined) {
      return undefined;
    }

    return new URL(path, this.settings.issuer).href;
  }
}
