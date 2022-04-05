import { JoseException } from './jose.exception';

/**
 * Raised when the provided Elliptic Curve is not supported.
 */
export class UnsupportedEllipticCurveException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided Elliptic Curve is not supported.';
  }
}
