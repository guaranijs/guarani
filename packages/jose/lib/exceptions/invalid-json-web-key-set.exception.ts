import { Optional } from '@guarani/types';

import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Key Set is invalid.
 */
export class InvalidJsonWebKeySetException extends JoseException {
  /**
   * Raised when the provided JSON Web Key Set is invalid.
   *
   * @param message Message describing the error.
   */
  public constructor(message: Optional<string> = 'The provided JSON Web Key Set is invalid.') {
    super(message);
  }
}
