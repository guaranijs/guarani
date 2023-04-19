import { ErrorCode } from './error-code.type';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the provided Redirect URI is invalid.
 */
export class InvalidRedirectUriException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public override readonly code: ErrorCode = 'invalid_redirect_uri';
}
