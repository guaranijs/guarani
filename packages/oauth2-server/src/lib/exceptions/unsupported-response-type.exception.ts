import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the requested **response_type** is not supported by the Authorization Server.
 */
export class UnsupportedResponseTypeException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly error = ErrorCode.UnsupportedResponseType;
}
