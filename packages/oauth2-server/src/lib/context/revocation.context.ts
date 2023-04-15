import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RevocationRequest } from '../requests/revocation-request';
import { TokenTypeHint } from '../types/token-type-hint.type';

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
  readonly token: AccessToken | RefreshToken | null;

  /**
   * Type of the Token provided by the Client.
   */
  readonly tokenType: TokenTypeHint | null;
}
