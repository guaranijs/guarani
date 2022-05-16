import { Injectable, InjectAll } from '@guarani/di';
import { Optional } from '@guarani/types';

import { IEndpoint } from '../endpoints/endpoint.interface';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { Endpoint } from '../types/endpoint';

/**
 * Abstract Base Class for the OAuth 2.0 Authorization Server.
 */
@Injectable()
export abstract class AuthorizationServer {
  /**
   * Endpoints of the Authorization Server.
   */
  @InjectAll('Endpoint')
  protected readonly endpoints!: IEndpoint[];

  /**
   * Creates an HTTP Response for the requested Endpoint.
   *
   * @param name Name of the Endpoint.
   * @param request HTTP Request.
   * @returns HTTP Response.
   */

  public async endpoint(name: Endpoint, request: HttpRequest): Promise<HttpResponse> {
    const endpoint: Optional<IEndpoint> = this.endpoints.find((endpoint) => endpoint.name === name);

    if (endpoint === undefined) {
      throw new TypeError(`Unsupported Endpoint "${name}".`);
    }

    return await endpoint.handle(request);
  }
}
