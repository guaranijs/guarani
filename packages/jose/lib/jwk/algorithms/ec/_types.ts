import { Dict } from '@guarani/utils'

/**
 * Names of the supported Elliptic Curves.
 */
export type SupportedEllipticCurve = 'P-256' | 'P-384' | 'P-521'

/**
 * Buffer representation of the `Unrestricted Algorithm Identifier` ObjectId.
 */
export const ID_EC_PUBLIC_KEY = Buffer.from([
  0x2a,
  0x86,
  0x48,
  0xce,
  0x3d,
  0x02,
  0x01
])

/**
 * Defines the necessary meta information of an Elliptic Curve.
 */
interface EllipticCurveParams {
  /**
   * Identifier of the Elliptic Curve.
   */
  readonly id: SupportedEllipticCurve

  /**
   * Name of the elliptic curve as registered with NodeJS' `crypto` module.
   */
  readonly name: string

  /**
   * String representation of the ObjectId of the Elliptic Curve.
   */
  readonly oid: string

  /**
   * Length of the Private Value and parameters of the key's Coordinate.
   */
  readonly length: number

  /**
   * Buffer representation of the Elliptic Curve's ObjectId.
   */
  readonly buffer: Buffer
}

/**
 * Defines the type of the Elliptic Curves Store.
 */
type EllipticCurves = Dict<EllipticCurveParams>

/**
 * Supported Elliptic Curves.
 */
export const ELLIPTIC_CURVES: EllipticCurves = {
  'P-256': {
    id: 'P-256',
    name: 'prime256v1',
    oid: '1.2.840.10045.3.1.7',
    length: 32,
    buffer: Buffer.from([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07])
  },
  'P-384': {
    id: 'P-384',
    name: 'secp384r1',
    oid: '1.3.132.0.34',
    length: 48,
    buffer: Buffer.from([0x2b, 0x81, 0x04, 0x00, 0x22])
  },
  'P-521': {
    id: 'P-521',
    name: 'secp521r1',
    oid: '1.3.132.0.35',
    length: 66,
    buffer: Buffer.from([0x2b, 0x81, 0x04, 0x00, 0x23])
  }
}
