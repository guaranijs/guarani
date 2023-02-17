import { ErrorCode } from './error-code.type';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the User still has not completed the interaction at the Device Code Grant Type.
 */
export class AuthorizationPendingException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public override readonly code: ErrorCode = 'authorization_pending';
}
