import { Optional } from '@guarani/types';

import { SupportedTokenType } from './supported-token-type';

/**
 * Parameters of the OAuth 2.0 Access Token Response.
 */
export interface AccessTokenResponse {
  /**
   * Access Token issued to the Client.
   */
  readonly access_token: string;

  /**
   * Type of the Access Token.
   */
  readonly token_type: SupportedTokenType;

  /**
   * Lifetime of the Access Token in seconds.
   */
  readonly expires_in: number;

  /**
   * Refresh Token issued to the Client.
   */
  readonly refresh_token?: Optional<string>;

  /**
   * Scope granted to the Client.
   */
  readonly scope: string;

  /**
   * Optional additional parameters.
   */
  [parameter: string]: any;
}
