import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the Authorization Server needs to prompt the End User
 * to select an authenticated account before proceeding.
 */
export class AccountSelectionRequiredException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly code = ErrorCode.AccountSelectionRequired;

  /**
   * Http Response Status Code of the OAuth 2.0 Exception.
   */
  public override readonly statusCode: number = 401;
}
