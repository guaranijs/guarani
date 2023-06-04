import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the provided Scope is insufficient for the authorized request.
 */
export class InsufficientScopeException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly error = ErrorCode.InsufficientScope;

  /**
   * Http Response Status Code of the OAuth 2.0 Exception.
   */
  public override readonly statusCode: number = 403;
}
