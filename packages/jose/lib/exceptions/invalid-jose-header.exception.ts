import { Optional } from '@guarani/types'

import { JoseException } from './jose.exception'

/**
 * Raised when the provided JOSE Header is invalid.
 */
export class InvalidJoseHeaderException extends JoseException {
  /**
   * Raised when the provided JOSE Header is invalid.
   *
   * @param message Message describing the error.
   */
  public constructor(
    message: Optional<string> = 'The provided JOSE Header is invalid.'
  ) {
    super(message)
  }
}
