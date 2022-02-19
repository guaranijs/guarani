import { Optional } from '@guarani/types'

import { JoseException } from './jose.exception'

/**
 * Raised when the provided JSON Web Key is invalid.
 */
export class InvalidJsonWebKeyException extends JoseException {
  /**
   * Raised when the provided JSON Web Key is invalid.
   *
   * @param message Message describing the error.
   */
  public constructor(
    message: Optional<string> = 'The provided JSON Web Key is invalid.'
  ) {
    super(message)
  }
}
