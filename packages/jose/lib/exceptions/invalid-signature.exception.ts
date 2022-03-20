import { Optional } from '@guarani/types';

import { JoseException } from './jose.exception';

/**
 * Raised when the provided signature does not match the provided message.
 */
export class InvalidSignatureException extends JoseException {
  /**
   * Raised when the provided signature does not match the provided message.
   *
   * @param message Message describing the error.
   */
  public constructor(message: Optional<string> = 'The provided signature does not match the provided message.') {
    super(message);
  }
}
