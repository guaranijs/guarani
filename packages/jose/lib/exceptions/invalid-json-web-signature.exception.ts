import { Optional } from '@guarani/types';

import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Signature is invalid.
 */
export class InvalidJsonWebSignatureException extends JoseException {
  /**
   * Raised when the provided JSON Web Signature is invalid.
   *
   * @param message Message describing the error.
   */
  public constructor(message: Optional<string> = 'The provided JSON Web Signature is invalid.') {
    super(message);
  }
}
