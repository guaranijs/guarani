import { Optional } from '@guarani/types';

import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Token is not valid yet.
 */
export class TokenNotValidYetException extends JoseException {
  /**
   * Raised when the provided JSON Web Token is not valid yet.
   *
   * @param message Message describing the error.
   */
  public constructor(message: Optional<string> = 'The provided JSON Web Token is not valid yet.') {
    super(message);
  }
}
