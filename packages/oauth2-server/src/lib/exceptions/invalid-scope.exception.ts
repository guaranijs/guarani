import { ErrorCode } from './error-code.type';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the requested Scope is invalid.
 */
export class InvalidScopeException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public override readonly code: ErrorCode = 'invalid_scope';
}
