import { createPrivateKey, createPublicKey, createSecretKey, KeyObject, randomBytes } from 'crypto'

import { ASN1, DER, PEM } from '@guarani/cryptography'
import { Base64Url } from '@guarani/utils'

import { InvalidKey, JoseError } from '../exceptions'

export interface JWKParams {
  kty: string
}

export interface OCTSecretParams extends JWKParams {
  k: string
}

export interface RSAPublicParams extends JWKParams {
  n: string
  e: string
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

export interface ECPublicParams extends JWKParams {
  crv: string
  x: string
  y: string
}

export interface ECPrivateParams extends ECPublicParams {
  d: string
}

export abstract class JWKAlgorithm {
  public abstract kty: string

  public constructor (data: JWKParams) {
    if (!data) throw new InvalidKey()
    if (typeof data !== 'object' || Array.isArray(data)) throw new InvalidKey()
    if (!data.kty || typeof data.kty !== 'string') throw new InvalidKey('Invalid parameter "kty".')
  }

  public abstract export (): string
}

export class OCTSecretKey extends JWKAlgorithm implements OCTSecretParams {
  public kty: 'oct'
  public k: string

  public constructor (data: OCTSecretParams) {
    super(data)

    if (data.kty !== 'oct') {
      throw new InvalidKey(`Invalid parameter "kty". Expected "oct", got "${data.kty}".`)
    }

    if (!data.k || typeof data.k !== 'string') throw new InvalidKey('Invalid parameter "k".')

    this.k = data.k
  }

  public get secretKey (): KeyObject {
    return createSecretKey(Base64Url.decode(this.k))
  }

  public static generate (size: number = 32): OCTSecretKey {
    if (typeof size !== 'number' || !Number.isInteger(size)) {
      throw new InvalidKey('The key size MUST be a valid integer.')
    }

    if (size < 32) throw new InvalidKey('The key size MUST be AT LEAST 32 bytes.')

    const secret = Base64Url.encode(randomBytes(size))
    return new OCTSecretKey({ kty: 'oct', k: secret })
  }

  public static parse (data: string | Buffer): OCTSecretKey {
    if (typeof data !== 'string' || !Buffer.isBuffer(data)) {
      throw new InvalidKey('The secret MUST be either a Base64Url string or a Buffer.')
    }

    const secret = (typeof data === 'string') ? data : Base64Url.encode(data)
    return new OCTSecretKey({ kty: 'oct', k: secret })
  }

  public export (): string {
    return Base64Url.decode(this.k).toString('base64')
  }
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
    const asn1 = new ASN1.ASN1()

    asn1.integer(Base64Url.decodeInt(this.n))
    asn1.integer(Base64Url.decodeInt(this.e))
    asn1.sequence()

    return asn1
  }

  public get publicKey (): KeyObject {
    const asn1 = this.getPublicParamsAsASN1()
    return createPublicKey({ key: DER.encode(asn1), format: 'der', type: 'pkcs1' })
  }

  public export (type?: 'pkcs1' | 'pkcs8'): string {
    if (type === 'pkcs1') {
      const asn1 = this.getPublicParamsAsASN1()
      return PEM.encode(DER.encode(asn1), 'RSA PUBLIC KEY')
    }

    if (type === 'pkcs8') {
      const key = this.getPublicParamsAsASN1()
      const asn1 = new ASN1.ASN1()

      asn1.oid('1.2.840.113549.1.1.1')
      asn1.null()
      asn1.sequence()
      asn1.bitString(DER.encode(key))
      asn1.sequence()

      return PEM.encode(DER.encode(asn1), 'PUBLIC KEY')
    }

    throw new JoseError('You MUST provide a valid type argument.')
  }
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
    const asn1 = new ASN1.ASN1()

    asn1.integer(0x00)
    asn1.integer(Base64Url.decodeInt(this.n))
    asn1.integer(Base64Url.decodeInt(this.e))
    asn1.integer(Base64Url.decodeInt(this.d))
    asn1.integer(Base64Url.decodeInt(this.p))
    asn1.integer(Base64Url.decodeInt(this.q))
    asn1.integer(Base64Url.decodeInt(this.dp))
    asn1.integer(Base64Url.decodeInt(this.dq))
    asn1.integer(Base64Url.decodeInt(this.qi))
    asn1.sequence()

    return asn1
  }

  public get privateKey (): KeyObject {
    const asn1 = this.getPrivateParamsAsASN1()
    return createPrivateKey({ key: DER.encode(asn1), format: 'der', type: 'pkcs1' })
  }

  public export (type?: 'pkcs1' | 'pkcs8'): string {
    if (type === 'pkcs1') {
      const asn1 = this.getPrivateParamsAsASN1()
      return PEM.encode(DER.encode(asn1), 'RSA PRIVATE KEY')
    }

    if (type === 'pkcs8') {
      const key = this.getPrivateParamsAsASN1()
      const id = new ASN1.ASN1()
      const asn1 = new ASN1.ASN1()

      id.oid('1.2.840.113549.1.1.1')
      id.null()
      id.sequence()

      asn1.integer(0x00)
      asn1.push(DER.encode(id))
      asn1.octString(DER.encode(key))
      asn1.sequence()

      return PEM.encode(DER.encode(asn1), 'PRIVATE KEY')
    }

    throw new JoseError('You MUST provide a valid type argument.')
  }
}
