import { Client } from '../../entities/client.entity';
import { DeleteRegistrationRequest } from '../../requests/registration/delete.registration-request';

/**
 * Parameters of the Delete Client Registration Context.
 */
export interface DeleteRegistrationContext {
  /**
   * Parameters of the Delete Registration Request.
   */
  readonly parameters: DeleteRegistrationRequest;

  /**
   * Client represented by the Client Identifier.
   */
  readonly client: Client;
}
