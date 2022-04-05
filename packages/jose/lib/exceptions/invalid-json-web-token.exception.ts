import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Token is invalid.
 */
export class InvalidJsonWebTokenException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided JSON Web Token is invalid.';
  }
}
