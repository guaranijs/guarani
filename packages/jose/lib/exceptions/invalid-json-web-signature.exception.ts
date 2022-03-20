import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Signature is invalid.
 */
export class InvalidJsonWebSignatureException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided JSON Web Signature is invalid.';
  }
}
