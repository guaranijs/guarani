import { Dict, Optional } from '@guarani/types';

import { TokenType } from '../types/token-type';

/**
 * Parameters of the OAuth 2.0 Token Response.
 */
export interface TokenResponse extends Dict {
  /**
   * Access Token issued to the Client.
   */
  readonly access_token: string;

  /**
   * Type of the Access Token.
   */
  readonly token_type: TokenType;

  /**
   * Lifetime of the Access Token in seconds.
   */
  readonly expires_in: number;

  /**
   * Scope granted to the Client.
   */
  readonly scope: string;

  /**
   * Refresh Token issued to the Client.
   */
  readonly refresh_token?: Optional<string>;
}
