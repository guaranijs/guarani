import { URLSearchParams } from 'url';

import { Nullable } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { TokenTypeHint } from '../types/token-type-hint.type';

/**
 * Parameters of the Revocation Context.
 */
export interface RevocationContext {
  /**
   * Parameters of the Revocation Request.
   */
  readonly parameters: URLSearchParams;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Instance of the Token provided by the Client.
   */
  readonly token: Nullable<AccessToken | RefreshToken>;

  /**
   * Type of the Token provided by the Client.
   */
  readonly tokenType: Nullable<TokenTypeHint>;
}
