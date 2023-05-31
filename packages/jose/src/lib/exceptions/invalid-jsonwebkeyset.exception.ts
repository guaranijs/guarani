import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Key Set is invalid.
 */
export class InvalidJsonWebKeySetException extends JoseException {
  /**
   * Instantiates a new Invalid JSON Web Key Set Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided JSON Web Key Set is invalid.', options?: ErrorOptions) {
    super(message, options);
  }
}
