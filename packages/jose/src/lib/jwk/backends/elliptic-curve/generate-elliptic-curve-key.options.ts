import { EllipticCurve } from '../elliptic-curve.type';

/**
 * Elliptic Curve JSON Web Key Generation Options.
 */
export interface GenerateEllipticCurveKeyOptions {
  /**
   * Name of the Elliptic Curve.
   */
  readonly curve: Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521'>;
}
