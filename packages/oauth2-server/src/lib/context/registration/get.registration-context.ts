import { AccessToken } from '../../entities/access-token.entity';
import { Client } from '../../entities/client.entity';
import { GetRegistrationRequest } from '../../requests/registration/get.registration-request';

/**
 * Parameters of the Get Client Registration Context.
 */
export interface GetRegistrationContext {
  /**
   * Parameters of the Get Registration Request.
   */
  readonly parameters: GetRegistrationRequest;

  /**
   * Access Token provided by the Client.
   */
  readonly accessToken: AccessToken;

  /**
   * Client represented by the Client Identifier.
   */
  readonly client: Client;
}
