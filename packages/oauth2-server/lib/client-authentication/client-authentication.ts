import { Injectable } from '@guarani/ioc';

import { ClientEntity } from '../entities/client.entity';
import { Request } from '../http/request';
import { SupportedClientAuthentication } from './types/supported-client-authentication';

/**
 * Abstract Base Class for the Client Authentication Methods supported by Guarani.
 */
@Injectable()
export abstract class ClientAuthentication {
  /**
   * Name of the Client Authentication Method.
   */
  public abstract readonly name: SupportedClientAuthentication;

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request HTTP Request.
   */
  public abstract hasBeenRequested(request: Request): boolean;

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request HTTP Request.
   * @returns Authenticated Client.
   */
  public abstract authenticate(request: Request): Promise<ClientEntity>;
}
