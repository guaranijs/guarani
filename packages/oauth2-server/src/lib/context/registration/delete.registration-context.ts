import { AccessToken } from '../../entities/access-token.entity';
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
   * Access Token provided by the Client.
   */
  readonly accessToken: AccessToken;

  /**
   * Client represented by the Client Identifier.
   */
  readonly client: Client;
}
