import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Key is invalid.
 */
export class InvalidJsonWebKeyException extends JoseException {
  /**
   * Instantiates a new Invalid JSON Web Key Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided JSON Web Key is invalid.') {
    super(message);
  }
}
