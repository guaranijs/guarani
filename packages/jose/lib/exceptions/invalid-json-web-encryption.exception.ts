import { Optional } from '@guarani/types';

import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Encryption is invalid.
 */
export class InvalidJsonWebEncryptionException extends JoseException {
  /**
   * Raised when the provided JSON Web Encryption is invalid.
   *
   * @param message Message describing the error.
   */
  public constructor(message: Optional<string> = 'The provided JSON Web Encryption is invalid.') {
    super(message);
  }
}
