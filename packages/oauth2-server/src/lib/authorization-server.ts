import { Injectable, InjectAll } from '@guarani/di';

import { EndpointInterface } from './endpoints/endpoint.interface';
import { ENDPOINT } from './endpoints/endpoint.token';
import { Endpoint } from './endpoints/endpoint.type';
import { HttpRequest } from './http/http.request';
import { HttpResponse } from './http/http.response';
import { Logger } from './logger/logger';

/**
 * Abstract Base Class for the OAuth 2.0 Authorization Server.
 */
@Injectable()
export abstract class AuthorizationServer {
  /**
   * Instantiates a new Authorization Server.
   *
   * @param logger Logger of the Authorization Server.
   * @param endpoints Endpoints of the Authorization Server.
   */
  public constructor(
    protected readonly logger: Logger,
    @InjectAll(ENDPOINT) protected readonly endpoints: EndpointInterface[],
  ) {}

  /**
   * Creates an Http Response for the requested Endpoint.
   *
   * @param name Name of the Endpoint.
   * @param request Http Request.
   * @returns Http Response.
   */
  public async endpoint(name: Endpoint, request: HttpRequest): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called endpoint()`, '05956a82-c04f-4b88-92b6-ca49c81b1277', {
      name,
      request,
    });

    const endpoint = this.endpoints.find((endpoint) => endpoint.name === name);

    if (typeof endpoint === 'undefined') {
      const exc = new TypeError(`Unsupported Endpoint "${name}".`);

      this.logger.critical(
        `[${this.constructor.name}] Called endpoint()`,
        '786373a1-ecd1-4dd8-912b-865d4d262d60',
        { name },
        exc,
      );

      throw exc;
    }

    return await endpoint.handle(request);
  }
}
