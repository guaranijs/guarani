import { ErrorCode } from '../types/error-code';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the requested **grant_type** is not supported by Guarani.
 */
export class UnsupportedGrantTypeException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly errorCode: ErrorCode = 'unsupported_grant_type';
}
