/**
 * Buffer representation of the `Unrestricted Algorithm Identifier` ObjectId.
 */
export const ID_EC_PUBLIC_KEY = Buffer.from([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01]);

/**
 * Names of the Supported Elliptic Curves.
 */
export type SupportedEllipticCurve = 'P-256' | 'P-384' | 'P-521';

/**
 * Defines the necessary meta information of an Elliptic Curve.
 */
interface EllipticCurveParams {
  /**
   * Identifier of the Elliptic Curve.
   */
  readonly id: string;

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
 * Supported Elliptic Curves.
 */
export const ELLIPTIC_CURVES: EllipticCurveParams[] = [
  { id: 'P-256', name: 'prime256v1', oid: '1.2.840.10045.3.1.7', length: 32 },
  { id: 'P-384', name: 'secp384r1', oid: '1.3.132.0.34', length: 48 },
  { id: 'P-521', name: 'secp521r1', oid: '1.3.132.0.35', length: 66 },
];
