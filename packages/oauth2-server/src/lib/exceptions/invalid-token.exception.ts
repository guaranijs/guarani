import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the provided Token is invalid.
 */
export class InvalidTokenException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly code = ErrorCode.InvalidToken;

  /**
   * Http Response Status Code of the OAuth 2.0 Exception.
   */
  public override readonly statusCode: number = 401;
}
