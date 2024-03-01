import { Injectable } from '@guarani/di';
import { JsonWebKeySet } from '@guarani/jose';

import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **JSON Web Key Set** Endpoint.
 *
 * This endpoint is used by the Client to retrieve the necessary JSON Web Key necessary for validation
 * of the Tokens issued by the Authorization Server.
 */
@Injectable()
export class JsonWebKeySetEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'jwks';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/jwks';

  /**
   * Http Methods of the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['GET'];

  /**
   * Instantiates a new JSON Web Key Set Endpoint.
   *
   * @param logger Logger of the Authorization Server.
   * @param jwks JSON Web Key Set of the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly jwks: JsonWebKeySet,
  ) {}

  /**
   * Creates a Http JSON Web Key Set Response.
   *
   * This method is responsible for fetching the JSON Web Key Set of the Authorization Server
   * and returning it as a JSON Response to the Client.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '7cf3c79d-e6a4-4915-ba37-3a00a26db34e', {
      request,
    });

    const response = new HttpResponse().json(this.jwks.toJSON(true));

    this.logger.debug(`[${this.constructor.name}] JSON Web Key Set completed`, 'a540d060-ba17-4351-a330-73f8f90efeb0', {
      response,
    });

    return response;
  }
}
