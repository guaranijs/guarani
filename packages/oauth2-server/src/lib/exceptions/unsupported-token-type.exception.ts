import { ErrorCode } from './error-code.type';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the requested **token_type** is not supported by the Authorization Server.
 */
export class UnsupportedTokenTypeException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public override readonly code: ErrorCode = 'unsupported_token_type';
}