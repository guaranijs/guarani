import { PostRegistrationContext } from '../context/registration/post.registration.context';
import { Client } from '../entities/client.entity';

/**
 * Interface of the Client Service.
 *
 * The Client Service contains the operations regarding the OAuth 2.0 Client.
 */
export interface ClientServiceInterface {
  /**
   * Creates a new Client based on the parameters of the Dynamic Client Registration Context.
   *
   * *note: this method is only required when enabling dynamic client registration.*
   *
   * @param context POST Registration Request Context.
   * @returns Newly created Client.
   */
  create?(context: PostRegistrationContext): Promise<Client>;

  /**
   * Searches the application's storage for a Client containing the provided Identifier.
   *
   * @param id Identifier of the Client.
   * @returns Client based on the provided Identifier.
   */
  findOne(id: string): Promise<Client | null>;

  /**
   * Removes the provided Client from the Authorization Server.
   *
   * *note: this method is only required when enabling dynamic client registration.*
   *
   * @param client Client to be removed from the Authorization Server.
   */
  remove?(client: Client): Promise<void>;
}
