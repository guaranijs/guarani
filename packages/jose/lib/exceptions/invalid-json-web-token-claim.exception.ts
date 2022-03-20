import { Optional } from '@guarani/types';

import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Token Claim is invalid.
 */
export class InvalidJsonWebTokenClaimException extends JoseException {
  /**
   * Raised when the provided JSON Web Token Claim is invalid.
   *
   * @param message Message describing the error.
   */
  public constructor(message: Optional<string> = 'The provided JSON Web Token Claim is invalid.') {
    super(message);
  }
}
