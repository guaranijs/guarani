import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Token is not valid yet.
 */
export class JsonWebTokenNotValidYetException extends JoseException {
  /**
   * Instantiates a new JSON Web Token Not Valid Yet Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided JSON Web Token is not valid yet.', options?: ErrorOptions) {
    super(message, options);
  }
}
