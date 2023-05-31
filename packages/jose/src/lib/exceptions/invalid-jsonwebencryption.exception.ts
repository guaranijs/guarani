import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Encryption is invalid.
 */
export class InvalidJsonWebEncryptionException extends JoseException {
  /**
   * Instantiates a new Invalid JSON Web Encryption Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided JSON Web Encryption is invalid.', options?: ErrorOptions) {
    super(message, options);
  }
}
