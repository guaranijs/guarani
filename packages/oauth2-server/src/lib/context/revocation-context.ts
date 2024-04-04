import { Nullable } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RevocationRequest } from '../requests/revocation-request';

/**
 * Parameters of the Revocation Context.
 */
export interface RevocationContext {
  /**
   * Parameters of the Revocation Request.
   */
  readonly parameters: RevocationRequest;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Instance of the Token provided by the Client.
   */
  readonly token: Nullable<AccessToken | RefreshToken>;
}
