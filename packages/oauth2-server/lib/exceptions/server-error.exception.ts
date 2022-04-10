import { OAuth2Exception } from './oauth2.exception';
import { SupportedOAuth2ErrorCode } from './types/supported-oauth2-error-code';

/**
 * Raised when the server encountered an unexpected error.
 */
export class ServerErrorException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly errorCode: SupportedOAuth2ErrorCode = 'server_error';

  /**
   * HTTP Response Status Code of the OAuth 2.0 Exception.
   */
  public readonly statusCode: number = 500;
}
