import { ErrorCode } from '../types/error-code';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the server is temporarily unavailable.
 */
export class TemporarilyUnavailableException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly errorCode: ErrorCode = 'temporarily_unavailable';

  /**
   * HTTP Response Status Code of the OAuth 2.0 Exception.
   */
  public readonly statusCode: number = 503;
}
