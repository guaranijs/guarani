import { Decoders, Encoders, Nodes } from '@guarani/asn1'
import { Base64Url, Primitives } from '@guarani/utils'

import { createPublicKey, KeyObject } from 'crypto'

import { InvalidKey } from '../../exceptions'
import { JsonWebKey, KeyOptions, PublicKey } from '../base'
import { CURVES, ID_EC_PUBLIC_KEY, SupportedCurves } from './_meta'

/**
 * Representation of the Public Parameters of an `Elliptic Curve` asymmetric key.
 */
export interface ECPublicParams extends KeyOptions {
  /**
   * Name of the curve.
   */
  crv: SupportedCurves

  /**
   * Base64Url representation of the X value.
   */
  x: string

  /**
   * Base64Url representation of the Y value.
   */
  y: string
}

/**
 * Implementation of the Elliptic Curve Asymmetric Key Algorithm.
 *
 * This class wraps the Elliptic Curve Public Key.
 *
 * The standard curves are: `P-256`, `P-384`, `P-521`.
 *
 * It is possible to add different curves, but they should be implemented
 * by the application for a good support.
 */
export class ECPublicKey
  extends JsonWebKey
  implements ECPublicParams, PublicKey {
  /**
   * The type of the key.
   */
  public readonly kty: 'EC'

  /**
   * Name of the Curve.
   */
  public readonly crv: SupportedCurves

  /**
   * Base64Url representation of the X value.
   */
  public readonly x: string

  /**
   * Base64Url representation of the Y value.
   */
  public readonly y: string

  /**
   * Instantiantes a new Elliptic Curve Public Key based on the provided parameters.
   *
   * @param key - Parameters of the key.
   * @param options - Defines the parameters of the JWK.
   */
  public constructor(key: ECPublicParams, options: KeyOptions = {}) {
    const params = { ...key, ...options }

    super(params)

    if (params.kty && params.kty !== 'EC')
      throw new InvalidKey(
        `Invalid parameter "kty". Expected "EC", got "${params.kty}".`
      )

    if (!(key.crv in CURVES))
      throw new InvalidKey(`Unsupported curve "${key.crv}".`)

    if (typeof key.x !== 'string')
      throw new InvalidKey('Invalid parameter "x".')

    if (typeof key.y !== 'string')
      throw new InvalidKey('Invalid parameter "y".')

    this.kty = 'EC'
    this.crv = key.crv
    this.x = key.x
    this.y = key.y
  }

  /**
   * Returns an instance of the NodeJS native public key.
   *
   * @returns Native Public Key Object.
   */
  public get publicKey(): KeyObject {
    const encodedPublicKey = _getEncodedPublicKey(this)

    const publicParams = new Nodes.Sequence(
      new Nodes.Sequence(
        new Nodes.ObjectId('1.2.840.10045.2.1'),
        new Nodes.ObjectId(CURVES[this.crv].oid)
      ),
      new Nodes.BitString(encodedPublicKey)
    )

    return createPublicKey({
      key: publicParams.encode(),
      format: 'der',
      type: 'spki'
    })
  }
}

/**
 * Parses a PEM encoded Elliptic Curve Public Key.
 *
 * @param pem - PEM representation of the Elliptic Curve Public Key.
 * @param options - Defines the parameters of the JWK.
 * @returns Instance of an ECPublicKey.
 */
export function parseEcPublicKey(
  pem: string,
  options?: KeyOptions
): ECPublicKey {
  if (typeof pem !== 'string') throw new TypeError('Invalid parameter "pem".')

  const key = createPublicKey(pem)
  const decoder = Decoders.DER(
    key.export({ format: 'der', type: 'spki' })
  ).sequence()

  const curveData = decoder.sequence()
  const ecKeyOid = curveData.objectid()
  const curveOid = curveData.objectid()

  if (Buffer.compare(ecKeyOid, ID_EC_PUBLIC_KEY) !== 0)
    throw new InvalidKey('Malformed curve.')

  const curve = Object.values(CURVES).find(
    curve => Buffer.compare(curve.buffer, curveOid) === 0
  )

  if (!curve) throw new InvalidKey('Malformed curve.')

  const publicKey = decoder.bitstring()

  if (publicKey.data[0] !== 0x04) throw new InvalidKey('Invalid Public Key.')

  publicKey.displace(1)

  const left = publicKey.data.subarray(0, curve.length)
  const right = publicKey.data.subarray(curve.length)

  const x = Base64Url.encodeInt(Primitives.fromBuffer(left, 'integer'))
  const y = Base64Url.encodeInt(Primitives.fromBuffer(right, 'integer'))

  return new ECPublicKey({ crv: curve.id, x, y }, options)
}

/**
 * Returns a PEM representation of the Public Key enveloped
 * in an X.509 SubjectPublicKeyInfo containing the Public
 * Parameters of the Key.
 *
 * @param key - Elliptic Curve Public Key to be exported.
 * @returns PEM encoded SPKI Elliptic Curve Public Key.
 *
 * @example
 * ```
 * > const pkcs1 = exportEcPublicKey(ecPublicKey)
 * > pkcs1
 * '-----BEGIN PUBLIC KEY-----\n' +
 * '<Base64 representation...>\n' +
 * '-----END PUBLIC KEY-----\n'
 * ```
 */
export function exportEcPublicKey(key: ECPublicKey): string {
  if (!(key instanceof ECPublicKey))
    throw new TypeError('Invalid parameter "key".')

  const publicParams = new Nodes.Sequence(
    new Nodes.Sequence(
      new Nodes.ObjectId('1.2.840.10045.2.1'),
      new Nodes.ObjectId(CURVES[key.crv].oid)
    ),
    new Nodes.BitString(_getEncodedPublicKey(key))
  )

  return Encoders.PEM(publicParams, 'PUBLIC KEY')
}

/**
 * Returns the Curve's uncompressed coordinate parameters.
 *
 * @param key - Key from where will be extracted the Public Params.
 * @returns Uncompressed coordinate parameters.
 */
export function _getEncodedPublicKey(key: ECPublicKey): Buffer {
  const length = CURVES[key.crv].length

  let x = Primitives.toBuffer(Base64Url.decodeInt(key.x))
  let y = Primitives.toBuffer(Base64Url.decodeInt(key.y))

  while (x.length < length) x = Buffer.concat([Primitives.toBuffer(0x00), x])
  while (y.length < length) y = Buffer.concat([Primitives.toBuffer(0x00), y])

  return Buffer.concat([Primitives.toBuffer(0x04), x, y])
}
