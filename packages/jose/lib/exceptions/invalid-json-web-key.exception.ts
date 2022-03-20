import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Key is invalid.
 */
export class InvalidJsonWebKeyException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided JSON Web Key is invalid.';
  }
}
