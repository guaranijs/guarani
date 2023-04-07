import { ErrorCode } from './error-code.type';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the provided Scope is insufficient for the authorized request.
 */
export class InsufficientScopeException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public override readonly code: ErrorCode = 'insufficient_scope';

  /**
   * Http Response Status Code of the OAuth 2.0 Exception.
   */
  public override readonly statusCode: number = 403;
}
