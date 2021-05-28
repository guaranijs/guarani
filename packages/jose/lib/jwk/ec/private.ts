import { Decoders, Encoders, Nodes } from '@guarani/asn1'
import { Base64Url, Primitives } from '@guarani/utils'

import { createPrivateKey, generateKeyPairSync, KeyObject } from 'crypto'

import { InvalidKey } from '../../exceptions'
import { KeyOptions, PrivateKey } from '../base'
import { ECPublicKey, ECPublicParams, _getEncodedPublicKey } from './public'
import { CURVES, SupportedCurves } from './_meta'

/**
 * Representation of the Private Parameters of an `Elliptic Curve` asymmetric key.
 */
export interface ECPrivateParams extends ECPublicParams {
  /**
   * Base64Url representation of the Private Value.
   */
  readonly d: string
}

/**
 * Implementation of the Elliptic Curve Asymmetric Key Algorithm.
 *
 * This class wraps the Elliptic Curve Private Key and extends
 * the functionality of the Elliptic Curve Public Key.
 *
 * The standard curves are: `P-256`, `P-384`, `P-521`.
 *
 * It is possible to add different curves, but they should be implemented
 * by the application for a good support.
 */
export class ECPrivateKey
  extends ECPublicKey
  implements ECPrivateParams, PrivateKey {
  /**
   * Base64Url representation of the Private Value.
   */
  public readonly d: string

  /**
   * Instantiantes a new RSA Private Key based on the provided parameters.
   *
   * @param key - Parameters of the key.
   * @param options - Defines the parameters of the JWK.
   */
  public constructor(key: ECPrivateParams, options: KeyOptions = {}) {
    super(key, options)

    if (typeof key.d !== 'string')
      throw new InvalidKey('Invalid parameter "d".')

    this.d = key.d
  }

  /**
   * Returns a 0-Padded Buffer version of the Private Value.
   *
   * @returns Padded Private Value.
   */
  private getPaddedPrivateValue(): Buffer {
    const curve = CURVES[this.crv]
    let privateValue = Primitives.toBuffer(Base64Url.decodeInt(this.d))

    while (privateValue.length < curve.length)
      privateValue = Buffer.concat([Primitives.toBuffer(0x00), privateValue])

    return privateValue
  }

  /**
   * Returns an instance of the NodeJS native private key.
   *
   * @returns Native Private Key Object.
   */
  public get privateKey(): KeyObject {
    const curve = CURVES[this.crv]
    const publicKey = _getEncodedPublicKey(this)

    const asn1 = new Nodes.Sequence(
      new Nodes.Integer(0x01),
      new Nodes.OctetString(this.getPaddedPrivateValue()),
      new Nodes.ContextSpecific(
        0x00,
        'constructed',
        new Nodes.ObjectId(curve.oid).encode()
      ),
      new Nodes.ContextSpecific(
        0x01,
        'constructed',
        new Nodes.BitString(publicKey).encode()
      )
    )

    return createPrivateKey({
      key: asn1.encode(),
      format: 'der',
      type: 'sec1'
    })
  }
}

/**
 * Interface describing the return of the Elliptic Curve Key Generation.
 */
interface ECKeyPair {
  /**
   * Elliptic Curve Public Key.
   */
  readonly publicKey: ECPublicKey

  /**
   * Elliptic Curve Private Key.
   */
  readonly privateKey: ECPrivateKey
}

/**
 * Creates a new Elliptic Curve Private Key.
 *
 * @param curve - Name of the Curve.
 * @param options - Defines the parameters of the JWK.
 * @returns Elliptic Curve Key Pair.
 */
export function createEcKeyPair(
  curve: SupportedCurves,
  options?: KeyOptions
): ECKeyPair {
  if (!(curve in CURVES)) throw new TypeError(`Unsupported curve "${curve}".`)

  const curveMeta = CURVES[curve]

  const { privateKey } = generateKeyPairSync('ec', {
    namedCurve: curveMeta.name
  })
  const der = privateKey.export({ format: 'der', type: 'sec1' })
  const decoder = Decoders.DER(der).sequence()

  // Removes the version.
  decoder.integer()

  const privateValue = decoder.octetstring()

  // Removes the Curve Identifier, since we already have its name.
  decoder.contextSpecific(0x00, false)

  const publicKey = decoder.contextSpecific(0x01).bitstring()

  // Since we are using Node's built-in generator, we trust that it just works.
  publicKey.displace(1)

  const x = Base64Url.encodeInt(
    Primitives.fromBuffer(
      publicKey.data.subarray(0, curveMeta.length),
      'integer'
    )
  )

  const y = Base64Url.encodeInt(
    Primitives.fromBuffer(publicKey.data.subarray(curveMeta.length), 'integer')
  )

  const d = Base64Url.encodeInt(
    Primitives.fromBuffer(privateValue.data, 'integer')
  )

  return {
    publicKey: new ECPublicKey({ crv: curve, x, y }, options),
    privateKey: new ECPrivateKey({ crv: curve, x, y, d }, options)
  }
}

/**
 * Parses a PEM encoded Elliptic Curve Private Key.
 *
 * @param pem - PEM representation of the Elliptic Curve Private Key.
 * @param options - Defines the parameters of the JWK.
 * @returns Instance of an ECPrivateKey.
 */
export function parseEcPrivateKey(
  pem: string,
  options?: KeyOptions
): ECPrivateKey {
  if (typeof pem !== 'string') throw new TypeError('Invalid parameter "pem".')

  const key = createPrivateKey(pem)
  const decoder = Decoders.DER(
    key.export({ format: 'der', type: 'sec1' })
  ).sequence()

  // Removes the version.
  decoder.integer()

  const privateKey = decoder.octetstring()
  const curveOid = decoder.contextSpecific(0x00, false).objectid()

  const curve = Object.values(CURVES).find(
    curve => Buffer.compare(curve.buffer, curveOid) === 0
  )

  if (!curve) throw new InvalidKey('Malformed curve.')

  const publicKey = decoder.contextSpecific(0x01).bitstring()

  if (publicKey.data[0] !== 0x04) throw new InvalidKey('Invalid Public Key.')

  publicKey.displace(1)

  const left = publicKey.data.subarray(0, curve.length)
  const right = publicKey.data.subarray(curve.length)

  const x = Base64Url.encodeInt(Primitives.fromBuffer(left, 'integer'))
  const y = Base64Url.encodeInt(Primitives.fromBuffer(right, 'integer'))
  const d = Base64Url.encodeInt(
    Primitives.fromBuffer(privateKey.data, 'integer')
  )

  return new ECPrivateKey({ crv: curve.id, x, y, d }, options)
}

/**
 * Returns a PEM representation of the Private Key
 * that contains only the parameters of the Key.
 *
 * @param key - Elliptic Curve Private Key to be exported.
 * @param format - ASN.1 Syntax Tree representation of the Private Key.
 * @returns PEM encoded SEC1 Elliptic Curve Private Key.
 *
 * @example
 * ```
 * > const sec1 = exportEcPrivateKey(ecPrivateKey, 'sec1')
 * > sec1
 * '-----BEGIN EC PRIVATE KEY-----\n' +
 * '<Base64 representation...>\n' +
 * '-----END EC PRIVATE KEY-----\n'
 * ```
 */
export function exportEcPrivateKey(key: ECPrivateKey, format: 'sec1'): string

/**
 * Returns a PEM representation of the Private Key enveloped
 * in a PKCS#8 object containing all the parameters of the key.
 *
 * @param key - Elliptic Curve Private Key to be exported.
 * @param format - ASN.1 Syntax Tree representation of the Private Key.
 * @returns PEM encoded PKCS#8 Elliptic Curve Private Key.
 *
 * @example
 * ```
 * > const pkcs8 = exportEcPrivateKey(ecPrivateKey, 'pkcs8')
 * > pkcs8
 * '-----BEGIN PRIVATE KEY-----\n' +
 * '<Base64 representation...>\n' +
 * '-----END PRIVATE KEY-----\n'
 * ```
 */
export function exportEcPrivateKey(key: ECPrivateKey, format: 'pkcs8'): string

export function exportEcPrivateKey(
  key: ECPrivateKey,
  format: 'sec1' | 'pkcs8'
): string {
  if (!(key instanceof ECPrivateKey))
    throw new TypeError('Invalid parameter "key".')

  const publicKey = _getEncodedPublicKey(key)
  const curve = CURVES[key.crv]
  const privateValue = (() => {
    let d = Primitives.toBuffer(Base64Url.decodeInt(key.d))

    while (d.length < curve.length)
      d = Buffer.concat([Primitives.toBuffer(0x00), d])

    return d
  })()

  if (format === 'sec1') {
    const asn1 = new Nodes.Sequence(
      new Nodes.Integer(0x01),
      new Nodes.OctetString(privateValue),
      new Nodes.ContextSpecific(
        0x00,
        'constructed',
        new Nodes.ObjectId(curve.oid).encode()
      ),
      new Nodes.ContextSpecific(
        0x01,
        'constructed',
        new Nodes.BitString(publicKey).encode()
      )
    )

    return Encoders.PEM(asn1, 'EC PRIVATE KEY')
  }

  if (format === 'pkcs8') {
    const privateKey = new Nodes.Sequence(
      new Nodes.Integer(0x01),
      new Nodes.OctetString(privateValue),
      new Nodes.ContextSpecific(
        0x01,
        'constructed',
        new Nodes.BitString(publicKey).encode()
      )
    )

    const asn1 = new Nodes.Sequence(
      new Nodes.Integer(0x00),
      new Nodes.Sequence(
        new Nodes.ObjectId('1.2.840.10045.2.1'),
        new Nodes.ObjectId(curve.oid)
      ),
      new Nodes.OctetString(privateKey.encode())
    )

    return Encoders.PEM(asn1, 'PRIVATE KEY')
  }

  throw new TypeError('Invalid parameter "format".')
}
