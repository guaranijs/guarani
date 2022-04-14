import { Request } from '../http/request';
import { Response } from '../http/response';
import { SupportedEndpoint } from './types/supported-endpoint';

/**
 * Interface for the endpoints of the OAuth 2.0 framework and its extensions.
 *
 * The type, status, headers and body of the response it returns, as well as its meaning and formatting
 * have to be documented by the respective endpoint.
 *
 * The method ***handle()*** **MUST NOT** raise **ANY** exceptions.
 * It **MUST** catch any exceptions and return a valid HTTP Error Response instead.
 */
export interface Endpoint {
  /**
   * Name of the Endpoint.
   */
  readonly name: SupportedEndpoint;

  /**
   * All Endpoints are required to implement this method, since it **MUST** return a response back to the Client.
   *
   * The Type, Status, Headers and Body of the Response it returns, as well as its meaning and formatting,
   * have to be documented by the respective endpoint.
   *
   * This method **MUST NOT** raise **ANY** exception.
   *
   * If an error occurred during the processing of the Request, it **MUST** be treated and its appropriate Status,
   * Headers and Body **MUST** be correctly set to denote the type of exception that occured.
   *
   * Other than the previous requirements, the endpoint is free to use whatever tools, methods and workflows it wishes.
   *
   * It is recommended to split the logic of the endpoint into small single-responsibility methods.
   *
   * @param request HTTP Request.
   * @returns HTTP Response.
   */
  handle(request: Request): Promise<Response>;
}
