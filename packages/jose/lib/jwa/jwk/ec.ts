import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  KeyObject
} from 'crypto'

import { ASN1, Decoders, Encoders } from '@guarani/cryptography'
import { Base64Url, Primitives } from '@guarani/utils'

import { InvalidKey } from '../../exceptions'
import { JWKAlgorithm, JWKAParams } from './algorithm'

export namespace EC {
  const { Nodes } = ASN1

  const idEcPublicKey = Buffer.from([0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01])

  interface CurveParams {
    id: string
    name: string
    oid: string
    length: number
    buffer: Buffer
  }

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

  export type SupportedCurves = 'P-256' | 'P-384' | 'P-521'

  export interface PublicParams extends JWKAParams {
    crv: string
    x: string
    y: string
  }

  class PublicKey extends JWKAlgorithm implements PublicParams {
    public kty: 'EC'
    public crv: string
    public x: string
    public y: string

    public constructor (data: PublicParams) {
      super(data)

      if (data.kty !== 'EC') {
        throw new InvalidKey(`Invalid parameter "kty". Expected "EC", got "${data.kty}".`)
      }

      if (!data.crv || typeof data.crv !== 'string') throw new InvalidKey('Invalid curve.')
      if (!(data.crv in CURVES)) throw new InvalidKey('Unsupported curve.')
      if (!data.x || typeof data.x !== 'string') throw new InvalidKey('Invalid parameter "x".')
      if (!data.y || typeof data.y !== 'string') throw new InvalidKey('Invalid parameter "y".')

      this.crv = data.crv
      this.x = data.x
      this.y = data.y
    }

    protected get idEcPublicKey () {
      return new Nodes.ObjectId('1.2.840.10045.2.1')
    }

    protected getEncodedPublicKey (): Buffer {
      const length = CURVES[this.crv].length

      let x = Primitives.toBuffer(Base64Url.decodeInt(this.x))
      let y = Primitives.toBuffer(Base64Url.decodeInt(this.y))

      while (x.length < length) x = Buffer.concat([Primitives.toBuffer(0x00), x])
      while (y.length < length) y = Buffer.concat([Primitives.toBuffer(0x00), y])

      return Buffer.concat([Primitives.toBuffer(0x04), x, y])
    }

    private getPublicParamsAsASN1 (): ASN1.ASN1 {
      const publicKey = this.getEncodedPublicKey()

      return new ASN1.ASN1(
        new Nodes.Sequence(
          new Nodes.Sequence(this.idEcPublicKey, new Nodes.ObjectId(CURVES[this.crv].oid)),
          new Nodes.BitString(publicKey)
        )
      )
    }

    public get publicKey (): KeyObject {
      return createPublicKey({
        key: this.export(),
        format: 'pem',
        type: 'spki'
      })
    }

    public export (): string {
      const asn1 = this.getPublicParamsAsASN1()
      return Encoders.PEM(asn1.encode(), 'PUBLIC KEY')
    }
  }

  export interface PrivateParams extends PublicParams {
    d: string
  }

  class PrivateKey extends PublicKey implements PrivateParams {
    public d: string

    public constructor (data: PrivateParams) {
      super(data)

      if (!data.d || typeof data.d !== 'string') throw new InvalidKey('Invalid parameter "d".')

      this.d = data.d
    }

    public get privateKey (): KeyObject {
      return createPrivateKey({
        key: this.export('sec1'),
        format: 'pem',
        type: 'sec1'
      })
    }

    public export (type?: 'sec1' | 'pkcs8'): string {
      const curve = CURVES[this.crv]
      let d = Primitives.toBuffer(Base64Url.decodeInt(this.d))

      while (d.length < curve.length) d = Buffer.concat([Primitives.toBuffer(0x00), d])

      if (type === 'sec1') {
        const publicKey = this.getEncodedPublicKey()

        const asn1 = new ASN1.ASN1(
          new Nodes.Sequence(
            new Nodes.Integer(0x01),
            new Nodes.OctetString(d),
            new Nodes.ContextSpecific(0, 'constructed', new Nodes.ObjectId(curve.oid).encode()),
            new Nodes.ContextSpecific(1, 'constructed', new Nodes.BitString(publicKey).encode())
          )
        )

        return Encoders.PEM(asn1.encode(), 'EC PRIVATE KEY')
      }

      if (type === 'pkcs8') {
        const publicKey = this.getEncodedPublicKey()

        const privateKey = new ASN1.ASN1(
          new Nodes.Sequence(
            new Nodes.Integer(0x01),
            new Nodes.OctetString(d),
            new Nodes.ContextSpecific(1, 'constructed', new Nodes.BitString(publicKey).encode())
          )
        )

        const asn1 = new ASN1.ASN1(
          new Nodes.Sequence(
            new Nodes.Integer(0x00),
            new Nodes.Sequence(this.idEcPublicKey, new Nodes.ObjectId(curve.oid)),
            new Nodes.OctetString(privateKey.encode())
          )
        )

        return Encoders.PEM(asn1.encode(), 'PRIVATE KEY')
      }

      throw new TypeError('You MUST provide a valid type argument.')
    }
  }

  export function create (curve: SupportedCurves): PrivateKey {
    const privateKey = generateKeyPairSync('ec', { namedCurve: CURVES[curve].name }).privateKey
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
      ) as bigint
    )

    const y = Base64Url.encodeInt(
      Primitives.fromBuffer(
        publicKey.data.subarray(publicKey.data.length / 2),
        'integer'
      ) as bigint
    )

    const d = Base64Url.encodeInt(Primitives.fromBuffer(privateValue.data, 'integer') as bigint)

    return new PrivateKey({ kty: 'EC', crv: curve, x, y, d })
  }

  /* eslint-disable no-redeclare */
  export function load (data: PublicParams): PublicKey
  export function load (data: PrivateParams): PrivateKey
  export function load (data: PublicParams | PrivateParams) {
    // @ts-expect-error
    if (data.d) return new PrivateKey(data)
    return new PublicKey(data)
  }

  /* eslint-disable no-redeclare */
  export function parse (data: string, keyType: 'public'): PublicKey
  export function parse (data: string, keyType: 'private'): PrivateKey
  export function parse (data: string, keyType: 'public' | 'private') {
    if (keyType === 'public') {
      const key = createPublicKey(data)
      const decoder = Decoders.DER(key.export({ format: 'der', type: 'spki' })).sequence()

      const curveData = decoder.sequence()
      const ecKeyOid = curveData.objectid()
      const curveOid = curveData.objectid()

      if (Buffer.compare(ecKeyOid, idEcPublicKey) !== 0) {
        throw new InvalidKey('Malformed curve.')
      }

      const curve = Object.values(CURVES).find(curve => Buffer.compare(curve.buffer, curveOid) === 0)

      if (!curve) {
        throw new InvalidKey('Malformed curve.')
      }

      const publicKey = decoder.bitstring()

      if (publicKey.data[0] !== 0x04) throw new InvalidKey('Invalid Public Key.')

      publicKey.displace(1)

      const left = publicKey.data.subarray(0, curve.length)
      const right = publicKey.data.subarray(curve.length)

      const x = Base64Url.encodeInt(Primitives.fromBuffer(left, 'integer') as bigint)
      const y = Base64Url.encodeInt(Primitives.fromBuffer(right, 'integer') as bigint)

      return new PublicKey({ kty: 'EC', crv: curve.id, x, y })
    }

    if (keyType === 'private') {
      const key = createPrivateKey(data)
      const decoder = Decoders.DER(key.export({ format: 'der', type: 'sec1' })).sequence()

      // Removes the version.
      decoder.integer()

      const privateKey = decoder.octetstring()
      const curveOid = decoder.contextSpecific(0x00, false).objectid()

      const curve = Object.values(CURVES).find(curve => Buffer.compare(curve.buffer, curveOid) === 0)

      if (!curve) {
        throw new InvalidKey('Malformed curve.')
      }

      const publicKey = decoder.contextSpecific(0x01).bitstring()

      if (publicKey.data[0] !== 0x04) throw new InvalidKey('Invalid Public Key.')

      publicKey.displace(1)

      const left = publicKey.data.subarray(0, curve.length)
      const right = publicKey.data.subarray(curve.length)

      const x = Base64Url.encodeInt(Primitives.fromBuffer(left, 'integer') as bigint)
      const y = Base64Url.encodeInt(Primitives.fromBuffer(right, 'integer') as bigint)
      const d = Base64Url.encodeInt(Primitives.fromBuffer(privateKey.data, 'integer') as bigint)

      return new PrivateKey({ kty: 'EC', crv: curve.id, x, y, d })
    }

    throw new InvalidKey('The key is neither public nor private.')
  }
}
