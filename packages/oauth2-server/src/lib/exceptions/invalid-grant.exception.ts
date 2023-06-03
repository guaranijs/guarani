import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the provided Authorization Grant is invalid.
 */
export class InvalidGrantException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly code = ErrorCode.InvalidGrant;
}
