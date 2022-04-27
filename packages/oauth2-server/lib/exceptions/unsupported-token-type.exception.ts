import { ErrorCode } from '../types/error-code';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the requested **token_type_hint** is not supported by Guarani.
 */
export class UnsupportedTokenTypeException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly errorCode: ErrorCode = 'unsupported_token_type';
}
