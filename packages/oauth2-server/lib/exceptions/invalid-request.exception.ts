import { OAuth2Exception } from './oauth2.exception';
import { SupportedOAuth2ErrorCode } from './types/supported-oauth2-error-code';

/**
 * Raised when the OAuth 2.0 Request is invalid.
 */
export class InvalidRequestException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly errorCode: SupportedOAuth2ErrorCode = 'invalid_request';
}
