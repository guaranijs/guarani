import { TokenRequest } from './token-request';

/**
 * Parameters of the **Authorization Code** Token Request.
 */
export interface AuthorizationCodeTokenRequest extends TokenRequest {
  /**
   * Authorization Code issued by the Authorization Server.
   */
  readonly code: string;

  /**
   * Redirect URI used on the Authorization Request.
   */
  readonly redirect_uri: string;

  /**
   * PKCE Code Challenge Verifier.
   */
  readonly code_verifier: string;
}
