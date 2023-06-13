import { URLSearchParams } from 'url';

import { Client } from '../../entities/client.entity';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';

/**
 * Parameters of the Token Context.
 */
export interface TokenContext {
  /**
   * Parameters of the Token Request.
   */
  readonly parameters: URLSearchParams;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Grant Type requested by the Client.
   */
  readonly grantType: GrantTypeInterface;
}
