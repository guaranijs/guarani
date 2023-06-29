import { Injectable, InjectAll } from '@guarani/di';

import { EndpointInterface } from './endpoints/endpoint.interface';
import { ENDPOINT } from './endpoints/endpoint.token';
import { Endpoint } from './endpoints/endpoint.type';
import { HttpRequest } from './http/http.request';
import { HttpResponse } from './http/http.response';

/**
 * Abstract Base Class for the OAuth 2.0 Authorization Server.
 */
@Injectable()
export abstract class AuthorizationServer {
  /**
   * Endpoints of the Authorization Server.
   */
  @InjectAll(ENDPOINT)
  protected readonly endpoints!: EndpointInterface[];

  /**
   * Creates an Http Response for the requested Endpoint.
   *
   * @param name Name of the Endpoint.
   * @param request Http Request.
   * @returns Http Response.
   */
  public async endpoint(name: Endpoint, request: HttpRequest): Promise<HttpResponse> {
    const endpoint = this.endpoints.find((endpoint) => endpoint.name === name);

    if (typeof endpoint === 'undefined') {
      throw new TypeError(`Unsupported Endpoint "${name}".`);
    }

    return await endpoint.handle(request);
  }
}
