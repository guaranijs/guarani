import { ErrorCode } from './error-code.type';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when Client Metadata is invalid.
 */
export class InvalidClientMetadataException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public override readonly code: ErrorCode = 'invalid_client_metadata';
}
