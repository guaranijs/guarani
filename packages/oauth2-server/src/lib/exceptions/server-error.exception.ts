import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the Authorization Server encounters an unexpected error.
 */
export class ServerErrorException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly code = ErrorCode.ServerError;

  /**
   * Http Response Status Code of the OAuth 2.0 Exception.
   */
  public override readonly statusCode: number = 500;
}
