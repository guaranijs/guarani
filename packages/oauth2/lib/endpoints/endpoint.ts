import { SupportedEndpoint } from '../constants'
import { Request, Response } from '../context'

/**
 * Interface for the endpoints of the OAuth 2.0 framework and its extensions.
 *
 * The type, status, headers and body of the response it returns,
 * as well as its meaning and formatting have to be documented
 * by the respective endpoint.
 *
 * The method `handle` **MUST NOT** raise exceptions.
 * It **MUST** catch the exceptions and return a valid error response instead.
 */
export interface Endpoint {
  /**
   * Name of the Endpoint.
   */
  readonly name: SupportedEndpoint

  /**
   * All endpoints are required to implement this method,
   * since it **MUST** return a response back to the Client.
   *
   * The type, status, headers and body of the response it returns,
   * as well as its meaning and formatting have to be documented by
   * the respective endpoint.
   *
   * This method **MUST NOT** raise **ANY** exception.
   *
   * If an error occurred during the processing of the Request,
   * it **MUST** be treated and its appropriate response status,
   * headers and body **MUST** be correctly set
   * to denote the type of exception that occured.
   *
   * Other than the previous requirements, the endpoint is free
   * to use whatever tools, methods and workflows it wishes.
   *
   * It is recommended to split the logic of the endpoint into small
   * single-responsibility methods for better maintenance.
   *
   * @param request Current Request.
   * @returns Response of the Endpoint.
   */
  handle(request: Request): Promise<Response>
}
