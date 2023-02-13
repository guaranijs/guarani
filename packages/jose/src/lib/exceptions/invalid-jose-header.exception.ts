import { JoseException } from './jose.exception';

/**
 * Raised when the provided JOSE Header is invalid.
 */
export class InvalidJoseHeaderException extends JoseException {
  /**
   * Instantiates a new Invalid JOSE Header Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided JOSE Header is invalid.') {
    super(message);
  }
}
