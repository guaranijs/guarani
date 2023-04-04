import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { Endpoint } from './endpoint.type';

/**
 * Interface for the Endpoints of the OAuth 2.0 Authorization Server.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-3
 */
export interface EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  readonly name: Endpoint;

  /**
   * Path of the Endpoint.
   */
  readonly path: string;

  /**
   * Http Methods supported by the Endpoint.
   */
  readonly httpMethods: HttpMethod[];

  /**
   * All Endpoints are required to implement this method, since it **MUST** return a Response back to the Client.
   *
   * The Type, Status, Headers and Body of the Response it returns, as well as its meaning and formatting,
   * have to be documented by the respective implementation.
   *
   * This method **MUST NOT** raise **ANY** exception.
   *
   * If an error occurred during the processing of the Request, it **MUST** be treated and its appropriate Status,
   * Headers and Body **MUST** be correctly set to denote the type of exception that occured.
   *
   * Other than the previous requirements, the endpoint is free to use whatever tools, methods and workflows it wishes.
   *
   * It is recommended to split the logic of the Endpoint into small single-responsibility methods.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  handle(request: HttpRequest): Promise<HttpResponse>;
}
