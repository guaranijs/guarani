import { JoseException } from './jose.exception';

/**
 * Raised when the requested Algorithm is not supported.
 */
export class UnsupportedAlgorithmException extends JoseException {
  /**
   * Instantiates a new Unsupported Algorithm Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The requested Algorithm is not supported.', options?: ErrorOptions) {
    super(message, options);
  }
}
