import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the Device Code has expired.
 */
export class ExpiredTokenException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly code = ErrorCode.ExpiredToken;
}
