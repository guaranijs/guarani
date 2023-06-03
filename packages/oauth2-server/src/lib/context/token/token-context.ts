import { Client } from '../../entities/client.entity';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { TokenRequest } from '../../requests/token/token-request';

/**
 * Parameters of the Token Context.
 */
export interface TokenContext<T extends TokenRequest> {
  /**
   * Parameters of the Token Request.
   */
  readonly parameters: T;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Grant Type requested by the Client.
   */
  readonly grantType: GrantTypeInterface;
}
