import { Client } from '../entities/client';
import { HttpRequest } from '../http/http.request';
import { ClientAuthentication } from '../types/client-authentication';

/**
 * Interface for the Client Authentication Methods supported by Guarani.
 */
export interface IClientAuthentication {
  /**
   * Name of the Client Authentication Method.
   */
  readonly name: ClientAuthentication;

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request HTTP Request.
   */
  hasBeenRequested(request: HttpRequest): boolean;

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request HTTP Request.
   * @returns Authenticated Client.
   */
  authenticate(request: HttpRequest): Promise<Client>;
}
