import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Token Claim is invalid.
 */
export class InvalidJsonWebTokenClaimException extends JoseException {
  /**
   * Instantiates a new Invalid JSON Web Token Claim Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided JSON Web Token Claim is invalid.') {
    super(message);
  }
}
