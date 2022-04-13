import { TokenParameters } from './token.parameters';

/**
 * Parameters of the Token Request of the Authorization Code Grant Type.
 */
export interface AuthorizationCodeParameters extends TokenParameters {
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
