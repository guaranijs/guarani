import { AccessToken } from '../entities/access-token.entity';
import { HttpRequest } from '../http/http.request';
import { ClientAuthorization } from './client-authorization.type';

/**
 * Interface of a Client Authorization Method.
 */
export interface ClientAuthorizationInterface {
  /**
   * Name of the Client Authorization Method.
   */
  readonly name: ClientAuthorization;

  /**
   * Checks if the Client Authorization Method has been requested by the Client.
   *
   * @param request Http Request.
   */
  hasBeenRequested(request: HttpRequest): boolean;

  /**
   * Checks and returns the Access Token requested by the Client.
   *
   * @param request Http Request.
   * @returns Access Token based on the provided Access Token Handle.
   */
  authorize(request: HttpRequest): Promise<AccessToken>;
}
