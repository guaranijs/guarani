import { Inject, Injectable, InjectAll } from '@guarani/ioc';
import { Optional } from '@guarani/types';

import { Endpoint } from './endpoints/endpoint';
import { SupportedEndpoint } from './endpoints/types/supported-endpoint';
import { Request } from './http/request';
import { Response } from './http/response';

/**
 * Abstract Base Class for the OAuth 2.0 Authorization Server.
 */
@Injectable()
export abstract class AuthorizationServer {
  /**
   * HTTPS URL without query or fragment components denoting the Issuer's Identifier.
   */
  @Inject('Issuer')
  public readonly issuer!: string;

  /**
   * Endpoints of the Authorization Server.
   */
  @InjectAll('Endpoint')
  private readonly endpoints!: Endpoint[];

  /**
   * Creates an HTTP Response for the requested Endpoint.
   *
   * @param name Name of the Endpoint.
   * @param request HTTP Request.
   * @returns HTTP Response.
   */
  public async endpoint(name: SupportedEndpoint, request: Request): Promise<Response> {
    const endpoint: Optional<Endpoint> = this.endpoints.find((endpoint) => endpoint.name === name);

    if (endpoint === undefined) {
      throw new TypeError(`Unsupported Endpoint "${name}".`);
    }

    return await endpoint.handle(request);
  }
}
