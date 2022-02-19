import { Optional } from '@guarani/types'

import { JoseException } from './jose.exception'

/**
 * Raised when the provided JSON Web Token is invalid.
 */
export class InvalidJsonWebTokenException extends JoseException {
  /**
   * Raised when the provided JSON Web Token is invalid.
   *
   * @param message Message describing the error.
   */
  public constructor(
    message: Optional<string> = 'The provided JSON Web Token is invalid.'
  ) {
    super(message)
  }
}
