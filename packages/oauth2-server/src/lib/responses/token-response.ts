import { AccessTokenType } from '../types/access-token-type.type';

/**
 * Parameters of the OAuth 2.0 Token Response.
 */
export interface TokenResponse {
  /**
   * Access Token issued to the Client.
   */
  readonly access_token: string;

  /**
   * Type of the Access Token.
   */
  readonly token_type: AccessTokenType;

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
  readonly refresh_token?: string;

  /**
   * ID Token issued to the Client.
   */
  id_token?: string;
}
