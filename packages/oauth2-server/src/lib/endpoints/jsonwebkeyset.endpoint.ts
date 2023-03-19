import { Injectable } from '@guarani/di';
import { JsonWebKeySet } from '@guarani/jose';

import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
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
   * @param jwks JSON Web Key Set of the Authorization Server.
   */
  public constructor(private readonly jwks: JsonWebKeySet) {}

  /**
   * Creates a Http JSON Web Key Set Response.
   *
   * This method is responsible for fetching the JSON Web Key Set of the Authorization Server
   * and returning it as a JSON Response to the Client.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  // @ts-expect-error Unused variable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    return new HttpResponse().json(this.jwks.toJSON(true));
  }
}
