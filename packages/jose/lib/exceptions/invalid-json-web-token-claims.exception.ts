import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Token Claims is invalid.
 */
export class InvalidJsonWebTokenClaimsException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided JSON Web Token Claims is invalid.';
  }
}
