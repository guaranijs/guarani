import { ExportJsonWebKeyOptions, GenerateJsonWebKeyOptions } from '../types';

/**
 * Supported Elliptic Curve.
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

/**
 * Options for generating Elliptic Curve JSON Web Keys.
 */
export interface GenerateEcKeyOptions extends GenerateJsonWebKeyOptions {
  /**
   * JSON Web Key Algorithm.
   */
  readonly kty: 'EC';

  /**
   * Name of the Elliptic Curve.
   */
  readonly curve: SupportedEllipticCurve;
}

/**
 * Encoding of the Elliptic Curve Key.
 */
type KeyEncoding = 'der' | 'pem';

/**
 * Format of the Elliptic Curve Key.
 */
type KeyFormat = 'sec1' | 'pkcs8' | 'spki';

/**
 * Type of the Elliptic Curve Key.
 */
type KeyType = 'private' | 'public';

/**
 * Options for exporting an Elliptic Curve Key.
 */
export interface ExportEcKeyOptions<E extends KeyEncoding, F extends KeyFormat, T extends KeyType>
  extends ExportJsonWebKeyOptions {
  /**
   * JSON Web Key Algorithm.
   */
  readonly kty: 'EC';

  /**
   * Encoding of the exported data.
   */
  readonly encoding: E;

  /**
   * Protocol used to encode the data.
   */
  readonly format: F;

  /**
   * Type of the key to be exported.
   */
  readonly type: T;
}
