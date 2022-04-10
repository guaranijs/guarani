import { OAuth2Exception } from './oauth2.exception';
import { SupportedOAuth2ErrorCode } from './types/supported-oauth2-error-code';

/**
 * Raised when the Client is not authorized to use the requested Grant.
 */
export class UnauthorizedClientException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly errorCode: SupportedOAuth2ErrorCode = 'unauthorized_client';
}
