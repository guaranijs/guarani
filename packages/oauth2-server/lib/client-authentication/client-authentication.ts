import { Client } from '../entities/client';
import { Request } from '../http/request';
import { SupportedClientAuthentication } from './types/supported-client-authentication';

/**
 * Interface for the Client Authentication Methods supported by Guarani.
 */
export interface ClientAuthentication {
  /**
   * Name of the Client Authentication Method.
   */
  readonly name: SupportedClientAuthentication;

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request HTTP Request.
   */
  hasBeenRequested(request: Request): boolean;

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request HTTP Request.
   * @returns Authenticated Client.
   */
  authenticate(request: Request): Promise<Client>;
}
