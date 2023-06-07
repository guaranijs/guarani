import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the Authorization Server is not able to meet the Authentication Context Class References
 * requested by the Client during Authentication.
 */
export class UnmetAuthenticationRequirementsException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly error = ErrorCode.UnmetAuthenticationRequirements;
}
