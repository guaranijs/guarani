import { JoseException } from './jose.exception';

/**
 * Raised when a JSON Web Token is expired.
 */
export class ExpiredTokenException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided JSON Web Token is expired.';
  }
}
