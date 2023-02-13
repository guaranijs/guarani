import { TokenRequest } from './token-request';

/**
 * Parameters of the **Refresh Token** Token Request.
 */
export interface RefreshTokenTokenRequest extends TokenRequest {
  /**
   * Refresh Token issued by the Authorization Server.
   */
  readonly refresh_token: string;

  /**
   * Subset of the Scope of the Refresh Token.
   */
  readonly scope?: string;
}
