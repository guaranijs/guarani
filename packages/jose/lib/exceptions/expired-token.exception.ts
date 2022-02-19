import { Optional } from '@guarani/types'

import { JoseException } from './jose.exception'

/**
 * Raised when a JSON Web Token is expired.
 */
export class ExpiredTokenException extends JoseException {
  /**
   * Raised when a JSON Web Token is expired.
   *
   * @param message Message describing the error.
   */
  public constructor(
    message: Optional<string> = 'The provided JSON Web Token is expired.'
  ) {
    super(message)
  }
}
