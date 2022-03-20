import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Key Set is invalid.
 */
export class InvalidJsonWebKeySetException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided JSON Web Key Set is invalid.';
  }
}
