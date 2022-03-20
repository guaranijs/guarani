import { SupportedEllipticCurve } from '../supported-elliptic-curve';

/**
 * Options for Generating an Elliptic Curve JSON Web Key.
 */
export interface GenerateEcKeyOptions {
  /**
   * Name of the Elliptic Curve.
   */
  readonly curve: SupportedEllipticCurve;
}
