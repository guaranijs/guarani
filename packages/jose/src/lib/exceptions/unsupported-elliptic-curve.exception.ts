import { JoseException } from './jose.exception';

/**
 * Raised when the provided Elliptic Curve is not supported.
 */
export class UnsupportedEllipticCurveException extends JoseException {
  /**
   * Instantiates a new Unsupported Elliptic Curve Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided Elliptic Curve is not supported.', options?: ErrorOptions) {
    super(message, options);
  }
}
