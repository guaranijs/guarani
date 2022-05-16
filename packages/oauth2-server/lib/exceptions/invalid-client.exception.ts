import { ErrorCode } from '../types/error-code';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the Client Authentication failed.
 */
export class InvalidClientException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly errorCode: ErrorCode = 'invalid_client';

  /**
   * HTTP Response Status Code of the OAuth 2.0 Exception.
   */
  public readonly statusCode: number = 401;
}
