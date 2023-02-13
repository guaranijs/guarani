import { Client } from '../entities/client.entity';

/**
 * Interface of the Client Service.
 *
 * The Client Service contains the operations regarding the OAuth 2.0 Client.
 */
export interface ClientServiceInterface {
  /**
   * Searches the application's storage for a Client containing the provided Identifier.
   *
   * @param id Identifier of the Client.
   * @returns Client based on the provided Identifier.
   */
  findOne(id: string): Promise<Client | null>;
}
