import { Client } from '../entities/client.entity';
import { HttpRequest } from '../http/http.request';
import { ClientAuthentication } from './client-authentication.type';

/**
 * Interface of a Client Authentication Method.
 */
export interface ClientAuthenticationInterface {
  /**
   * Name of the Client Authentication Method.
   */
  readonly name: ClientAuthentication;

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request Http Request.
   */
  hasBeenRequested(request: HttpRequest): boolean;

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request Http Request.
   * @returns Authenticated Client.
   */
  authenticate(request: HttpRequest): Promise<Client>;
}
