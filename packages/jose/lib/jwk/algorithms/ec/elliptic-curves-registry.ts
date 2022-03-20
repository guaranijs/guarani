import { SupportedEllipticCurve } from './supported-elliptic-curve';

/**
 * Defines the necessary meta information of an Elliptic Curve.
 */
interface EllipticCurveParams {
  /**
   * Identifier of the Elliptic Curve.
   */
  readonly id: SupportedEllipticCurve;

  /**
   * Name of the elliptic curve as registered with NodeJS' `crypto` module.
   */
  readonly name: string;

  /**
   * String representation of the ObjectId of the Elliptic Curve.
   */
  readonly oid: string;

  /**
   * Length of the Private Value and parameters of the key's Coordinate.
   */
  readonly length: number;
}

/**
 * Elliptic Curves Registry.
 */
export const ELLIPTIC_CURVES_REGISTRY: EllipticCurveParams[] = [
  { id: 'P-256', name: 'prime256v1', oid: '1.2.840.10045.3.1.7', length: 32 },
  { id: 'P-384', name: 'secp384r1', oid: '1.3.132.0.34', length: 48 },
  { id: 'P-521', name: 'secp521r1', oid: '1.3.132.0.35', length: 66 },
];
