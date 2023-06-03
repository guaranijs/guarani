import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the requested **grant_type** is not supported by the Authorization Server.
 */
export class UnsupportedGrantTypeException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly code = ErrorCode.UnsupportedGrantType;
}
