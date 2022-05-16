import { Optional } from '@guarani/types';

import { Client } from '../entities/client';

/**
 * Representation of the Client Service.
 *
 * The Client Service contains the operations performed by Guarani regarding the OAuth 2.0 Client.
 */
export interface IClientService {
  /**
   * Searches the application's storage for a Client containing the provided Identifier.
   *
   * @param clientId Identifier of the Client.
   * @returns Client based on the provided Identifier.
   */
  findClient(clientId: string): Promise<Optional<Client>>;
}
