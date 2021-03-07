import { createPrivateKey, createPublicKey, generateKeyPairSync, KeyObject } from 'crypto'

import { ASN1, Decoders, Encoders } from '@guarani/cryptography'
import { Base64Url } from '@guarani/utils'

import { InvalidKey, JoseError } from '../../exceptions'
import { JWKAlgorithm, JWKParams } from './algorithm'

const { Nodes } = ASN1

export interface RSAPublicParams extends JWKParams {
  n: string
  e: string
}

export class RSAPublicKey extends JWKAlgorithm implements RSAPublicParams {
  public kty: 'RSA'
  public n: string
  public e: string

  public constructor (data: RSAPublicParams) {
    super(data)

    if (data.kty !== 'RSA') {
      throw new InvalidKey(`Invalid parameter "kty". Expected "RSA", got "${data.kty}".`)
    }

    if (!data.n || typeof data.n !== 'string') throw new InvalidKey('Invalid parameter "n".')
    if (!data.e || typeof data.e !== 'string') throw new InvalidKey('Invalid parameter "e".')

    this.n = data.n
    this.e = data.e
  }

  private getPublicParamsAsASN1 (): ASN1.ASN1 {
    return new ASN1.ASN1(
      new Nodes.Sequence(
        new Nodes.Integer(Base64Url.decodeInt(this.n)),
        new Nodes.Integer(Base64Url.decodeInt(this.e))
      )
    )
  }

  public get publicKey (): KeyObject {
    const asn1 = this.getPublicParamsAsASN1()

    return createPublicKey({
      key: asn1.encode(),
      format: 'der',
      type: 'pkcs1'
    })
  }

  public export (type?: 'pkcs1' | 'spki'): string {
    if (type === 'pkcs1') {
      const asn1 = this.getPublicParamsAsASN1()
      return Encoders.PEM(asn1.encode(), 'RSA PUBLIC KEY')
    }

    if (type === 'spki') {
      const key = this.getPublicParamsAsASN1()
      const asn1 = new ASN1.ASN1(
        new Nodes.Sequence(
          new Nodes.Sequence(
            new Nodes.ObjectId('1.2.840.113549.1.1.1'),
            new Nodes.Null()
          ),
          new Nodes.BitString(key.encode())
        )
      )

      return Encoders.PEM(asn1.encode(), 'PUBLIC KEY')
    }

    throw new JoseError('You MUST provide a valid type argument.')
  }
}

export interface RSAPrivateParams extends RSAPublicParams {
  d: string
  p?: string
  q?: string
  dp?: string
  dq?: string
  qi?: string
  oth?: [string?, string?, string?]
}

export class RSAPrivateKey extends RSAPublicKey implements RSAPrivateParams {
  public d: string
  public p?: string
  public q?: string
  public dp?: string
  public dq?: string
  public qi?: string

  public constructor (data: RSAPrivateParams) {
    super(data)

    if (!data.d || typeof data.d !== 'string') throw new InvalidKey('Invalid parameter "d".')
    if (!data.p || typeof data.p !== 'string') throw new InvalidKey('Invalid parameter "p".')
    if (!data.q || typeof data.q !== 'string') throw new InvalidKey('Invalid parameter "q".')
    if (!data.dp || typeof data.dp !== 'string') throw new InvalidKey('Invalid parameter "dp".')
    if (!data.dq || typeof data.dq !== 'string') throw new InvalidKey('Invalid parameter "dq".')
    if (!data.qi || typeof data.qi !== 'string') throw new InvalidKey('Invalid parameter "qi".')

    this.d = data.d
    this.p = data.p
    this.q = data.q
    this.dp = data.dp
    this.dq = data.dq
    this.qi = data.qi
  }

  private getPrivateParamsAsASN1 (): ASN1.ASN1 {
    return new ASN1.ASN1(
      new Nodes.Sequence(
        new Nodes.Integer(0x00),
        new Nodes.Integer(Base64Url.decodeInt(this.n)),
        new Nodes.Integer(Base64Url.decodeInt(this.e)),
        new Nodes.Integer(Base64Url.decodeInt(this.d)),
        new Nodes.Integer(Base64Url.decodeInt(this.p)),
        new Nodes.Integer(Base64Url.decodeInt(this.q)),
        new Nodes.Integer(Base64Url.decodeInt(this.dp)),
        new Nodes.Integer(Base64Url.decodeInt(this.dq)),
        new Nodes.Integer(Base64Url.decodeInt(this.qi))
      )
    )
  }

  public get privateKey (): KeyObject {
    const asn1 = this.getPrivateParamsAsASN1()

    return createPrivateKey({
      key: asn1.encode(),
      format: 'der',
      type: 'pkcs1'
    })
  }

  // @ts-expect-error
  public export (type?: 'pkcs1' | 'pkcs8'): string {
    if (type === 'pkcs1') {
      const asn1 = this.getPrivateParamsAsASN1()
      return Encoders.PEM(asn1.encode(), 'RSA PRIVATE KEY')
    }

    if (type === 'pkcs8') {
      const key = this.getPrivateParamsAsASN1()
      const asn1 = new ASN1.ASN1(
        new Nodes.Sequence(
          new Nodes.Integer(0x00),
          new Nodes.Sequence(
            new Nodes.ObjectId('1.2.840.113549.1.1.1'),
            new Nodes.Null()
          ),
          new Nodes.OctetString(key.encode())
        )
      )

      return Encoders.PEM(asn1.encode(), 'PRIVATE KEY')
    }

    throw new JoseError('You MUST provide a valid type argument.')
  }
}

export function createRsaKey (
  modulusLength: number = 2048,
  publicExponent: number = 65537
): [RSAPublicKey, RSAPrivateKey] {
  const privateKey = generateKeyPairSync('rsa', { modulusLength, publicExponent }).privateKey
  const der = privateKey.export({ format: 'der', type: 'pkcs1' })
  const decoder = Decoders.DER(der).sequence()

  // Extracts the version of the private key.
  decoder.integer()

  const n = Base64Url.encodeInt(decoder.integer())
  const e = Base64Url.encodeInt(decoder.integer())
  const d = Base64Url.encodeInt(decoder.integer())
  const p = Base64Url.encodeInt(decoder.integer())
  const q = Base64Url.encodeInt(decoder.integer())
  const dp = Base64Url.encodeInt(decoder.integer())
  const dq = Base64Url.encodeInt(decoder.integer())
  const qi = Base64Url.encodeInt(decoder.integer())

  return [
    new RSAPublicKey({ kty: 'RSA', n, e }),
    new RSAPrivateKey({ kty: 'RSA', n, e, d, p, q, dp, dq, qi })
  ]
}

/* eslint-disable no-redeclare */
export function parseRsaKey (data: string, keyType: 'public'): RSAPublicKey
export function parseRsaKey (data: string, keyType: 'private'): RSAPrivateKey
export function parseRsaKey (data: string, keyType: 'public' | 'private') {
  if (keyType === 'public') {
    const key = createPublicKey(data)
    const decoder = Decoders.DER(key.export({ format: 'der', type: 'pkcs1' })).sequence()

    const n = Base64Url.encodeInt(decoder.integer())
    const e = Base64Url.encodeInt(decoder.integer())

    return new RSAPublicKey({ kty: 'RSA', n, e })
  }

  if (keyType === 'private') {
    const key = createPrivateKey(data)
    const decoder = Decoders.DER(key.export({ format: 'der', type: 'pkcs1' })).sequence()

    // Extracts the version of the private key.
    decoder.integer()

    const n = Base64Url.encodeInt(decoder.integer())
    const e = Base64Url.encodeInt(decoder.integer())
    const d = Base64Url.encodeInt(decoder.integer())
    const p = Base64Url.encodeInt(decoder.integer())
    const q = Base64Url.encodeInt(decoder.integer())
    const dp = Base64Url.encodeInt(decoder.integer())
    const dq = Base64Url.encodeInt(decoder.integer())
    const qi = Base64Url.encodeInt(decoder.integer())

    return new RSAPrivateKey({ kty: 'RSA', n, e, d, p, q, dp, dq, qi })
  }

  throw new InvalidKey('The key is neither public nor private.')
}
