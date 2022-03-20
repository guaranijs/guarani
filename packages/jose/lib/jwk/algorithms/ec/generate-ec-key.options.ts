import { SupportedEllipticCurve } from './supported-elliptic-curve';

/**
 * RsaKey generation options.
 */
export interface GenerateEcKeyOptions {
  /**
   * Name of the Elliptic Curve.
   */
  readonly curve: SupportedEllipticCurve;
}
