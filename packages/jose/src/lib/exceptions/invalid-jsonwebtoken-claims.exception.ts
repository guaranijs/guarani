import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Token Claims is invalid.
 */
export class InvalidJsonWebTokenClaimsException extends JoseException {
  /**
   * Instantiates a new Invalid JSON Web Token Claims Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided JSON Web Token Claims is invalid.', options?: ErrorOptions) {
    super(message, options);
  }
}
