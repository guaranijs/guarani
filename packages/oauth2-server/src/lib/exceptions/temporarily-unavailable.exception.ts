import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the Authorization Server is temporarily unavailable.
 */
export class TemporarilyUnavailableException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly error = ErrorCode.TemporarilyUnavailable;

  /**
   * Http Response Status Code of the OAuth 2.0 Exception.
   */
  public override readonly statusCode: number = 503;
}
