import { ErrorCode } from '../types/error-code';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the OAuth 2.0 Request is invalid.
 */
export class InvalidRequestException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly errorCode: ErrorCode = 'invalid_request';
}
