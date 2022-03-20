import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Encryption is invalid.
 */
export class InvalidJsonWebEncryptionException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided JSON Web Encryption is invalid.';
  }
}
