import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Signature is invalid.
 */
export class InvalidJsonWebSignatureException extends JoseException {
  /**
   * Instantiates a new Invalid JSON Web Signature Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided JSON Web Signature is invalid.') {
    super(message);
  }
}
