import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  KeyObject
} from 'crypto'

import { Decoders, Encoders, Nodes } from '@guarani/asn1'
import { Base64Url, Primitives } from '@guarani/utils'

import { InvalidKey } from '../../exceptions'
import { AsymmetricKey, JWKAlgorithm, JWKAParams } from './algorithm'

/**
 * Names of the supported Elliptic Curves.
 */
export type SupportedCurves = 'P-256' | 'P-384' | 'P-521'

/**
 * Buffer representation of the `Unrestricted Algorithm Identifier` ObjectId.
 */
const ID_EC_PUBLIC_KEY = Buffer.from([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01])

/**
 * Defines the necessary meta information of an Elliptic Curve.
 */
interface CurveParams {
  /**
   * Identifier of the Elliptic Curve.
   */
  id: SupportedCurves

  /**
   * Name of the curve as registered with NodeJS' `crypto` module.
   */
  name: string

  /**
   * String representation of the ObjectId of the Curve.
   */
  oid: string

  /**
   * Length of the Private Value and parameters of the key's Coordinate.
   */
  length: number

  /**
   * Buffer representation of the Curve's ObjectId.
   */
  buffer: Buffer
}

/**
 * Supported Curves.
 */
const CURVES: { [key: string]: CurveParams } = {
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

/**
 * Representation of the parameters of an `Elliptic Curve` asymmetric curve.
 */
export interface ECParams extends JWKAParams {
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

  /**
   * Base64Url representation of the Private Value.
   */
  d?: string
}

/**
 * Implementation of the Elliptic Curve Asymmetric Key Algorithm.
 *
 * The standard curves are: `P-256`, `P-384`, `P-521`.
 *
 * It is possible to add different curves, but they should be implemented
 * by the application for a good support.
 */
export class ECKey extends JWKAlgorithm implements AsymmetricKey, ECParams {
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
   * Base64Url representation of the Private Value.
   */
  public readonly d?: string

  /**
   * Instantiates a new ECKey based on the provided parameters.
   *
   * @param data - Data of the key. If the key is public, the required
   * parameters are `kty`, `crv`, `x` and `y`. If the key is private,
   * the parameter `d` is also required.
   */
  public constructor(data: ECParams) {
    super(data)

    if (data.kty !== 'EC')
      throw new InvalidKey(
        `Invalid parameter "kty". Expected "EC", got "${data.kty}".`
      )

    if (!(data.crv in CURVES))
      throw new InvalidKey(`Unsupported curve "${data.crv}".`)

    if (typeof data.x !== 'string')
      throw new InvalidKey('Invalid parameter "x".')

    if (typeof data.y !== 'string')
      throw new InvalidKey('Invalid parameter "y".')

    this.crv = data.crv
    this.x = data.x
    this.y = data.y

    if (data.d) {
      if (typeof data.d !== 'string')
        throw new InvalidKey('Invalid parameter "d".')

      this.d = data.d
    }
  }

  /**
   * Returns an ASN.1 ObjectId Type representing the
   * `Unrestricted Algorithm Identifier`.
   */
  private get idEcPublicKey() {
    return new Nodes.ObjectId('1.2.840.10045.2.1')
  }

  /**
   * Returns the Curve's uncompressed coordinate parameters.
   *
   * @returns Uncompressed coordinate parameters.
   */
  private getEncodedPublicKey(): Buffer {
    const length = CURVES[this.crv].length

    let x = Primitives.toBuffer(Base64Url.decodeInt(this.x))
    let y = Primitives.toBuffer(Base64Url.decodeInt(this.y))

    while (x.length < length) x = Buffer.concat([Primitives.toBuffer(0x00), x])
    while (y.length < length) y = Buffer.concat([Primitives.toBuffer(0x00), y])

    return Buffer.concat([Primitives.toBuffer(0x04), x, y])
  }

  /**
   * Returns an ASN.1 Syntax Tree of the SPKI Public Key.
   *
   * @returns ASN.1 Syntax Tree of the SPKI Public Key.
   */
  private getPublicParamsAsASN1(): Nodes.Node {
    const publicKey = this.getEncodedPublicKey()

    return new Nodes.Sequence(
      new Nodes.Sequence(
        this.idEcPublicKey,
        new Nodes.ObjectId(CURVES[this.crv].oid)
      ),
      new Nodes.BitString(publicKey)
    )
  }

  /**
   * Returns an instance of the NodeJS native public key.
   *
   * @returns Native Public Key Object.
   */
  public getPublicKey(): KeyObject {
    return createPublicKey({
      key: this.getPublicParamsAsASN1().encode(),
      format: 'der',
      type: 'spki'
    })
  }

  /**
   * Returns an instance of the NodeJS native private key.
   *
   * @returns Native Private Key Object.
   */
  public getPrivateKey(): KeyObject {
    return createPrivateKey({
      key: this.export('sec1', 'private'),
      format: 'pem',
      type: 'sec1'
    })
  }

  /**
   * Returns a PEM representation of the Public Key.
   *
   * @param type - ASN.1 Syntax Tree representation of the Public Key.
   * @param keyType - Defines the key type as `public`.
   * @returns PEM encoded Public Key.
   */
  public export(type: 'spki', keyType: 'public'): string

  /**
   * Returns a PEM representation of the Private Key.
   *
   * @param type - ASN.1 Syntax Tree representation of the Private Key.
   * @param keyType - Defines the key type as `private`.
   * @returns PEM encoded Private Key.
   */
  public export(type: 'sec1' | 'pkcs8', keyType: 'private'): string

  public export(
    type: 'spki' | 'sec1' | 'pkcs8',
    keyType: 'public' | 'private'
  ): string {
    const curve = CURVES[this.crv]
    const privateValue = (() => {
      let d = Primitives.toBuffer(Base64Url.decodeInt(this.d))

      while (d.length < curve.length)
        d = Buffer.concat([Primitives.toBuffer(0x00), d])

      return d
    })()

    return {
      public: {
        spki: () => Encoders.PEM(this.getPublicParamsAsASN1(), 'PUBLIC KEY')
      },
      private: {
        sec1: () => {
          const publicKey = this.getEncodedPublicKey()

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
        },
        pkcs8: () => {
          const publicKey = this.getEncodedPublicKey()

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
              this.idEcPublicKey,
              new Nodes.ObjectId(curve.oid)
            ),
            new Nodes.OctetString(privateKey.encode())
          )

          return Encoders.PEM(asn1, 'PRIVATE KEY')
        }
      }
    }[keyType][type]()
  }
}

/**
 * Creates a new Elliptic Curve Private Key.
 *
 * @param curve - Name of the Curve.
 * @returns Instance of an ECKey.
 */
export function createEcKey(curve: SupportedCurves): ECKey {
  if (!(curve in CURVES)) throw new TypeError(`Unsupported curve "${curve}".`)

  const { privateKey } = generateKeyPairSync('ec', {
    namedCurve: CURVES[curve].name
  })
  const der = privateKey.export({ format: 'der', type: 'sec1' })
  const decoder = Decoders.DER(der).sequence()

  // Removes the version.
  decoder.integer()

  const privateValue = decoder.octetstring()

  // Removes the Curve Identifier, since we already have its name.
  decoder.contextSpecific(0x00, false)

  const publicKey = decoder.contextSpecific(0x01).bitstring()

  // Since we are using Node's built-in generator, we trust that it works correctly.
  publicKey.displace(1)

  const x = Base64Url.encodeInt(
    Primitives.fromBuffer(
      publicKey.data.subarray(0, publicKey.data.length / 2),
      'integer'
    )
  )

  const y = Base64Url.encodeInt(
    Primitives.fromBuffer(
      publicKey.data.subarray(publicKey.data.length / 2),
      'integer'
    )
  )

  const d = Base64Url.encodeInt(
    Primitives.fromBuffer(privateValue.data, 'integer')
  )

  return new ECKey({ kty: 'EC', crv: curve, x, y, d })
}

/**
 * Parses a PEM encoded Public Key.
 *
 * @param data - PEM representation of the Public Key.
 * @param keyType - Defines the key type as `public`.
 * @returns Instance of an ECKey.
 */
export function parseEcKey(data: string, keyType: 'public'): ECKey

/**
 * Parses a PEM encoded Private Key.
 *
 * @param data - PEM representation of the Private Key.
 * @param keyType - Defines the key type as `private`.
 * @returns Instance of an RSAKey.
 */
export function parseEcKey(data: string, keyType: 'private'): ECKey

export function parseEcKey(data: string, keyType: 'public' | 'private'): ECKey {
  if (typeof data !== 'string') throw new TypeError('Invalid parameter "data".')

  if (keyType === 'public') {
    const key = createPublicKey(data)
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

    return new ECKey({ kty: 'EC', crv: curve.id, x, y })
  }

  if (keyType === 'private') {
    const key = createPrivateKey(data)
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

    return new ECKey({ kty: 'EC', crv: curve.id, x, y, d })
  }

  throw new TypeError('Invalid parameter "keyType".')
}
