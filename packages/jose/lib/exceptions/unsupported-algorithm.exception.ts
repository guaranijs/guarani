import { Optional } from '@guarani/types';

import { JoseException } from './jose.exception';

/**
 * Raised when the provided algorithm in not supported.
 */
export class UnsupportedAlgorithmException extends JoseException {
  /**
   * Raised when the provided algorithm in not supported.
   *
   * @param message Message describing the error.
   */
  public constructor(message: Optional<string> = 'The provided algorithm is currently not supported.') {
    super(message);
  }
}
