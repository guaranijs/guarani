import { createPrivateKey, createPublicKey, KeyObject } from 'crypto'

import { ASN1, Encoders, Nodes } from '@guarani/cryptography'
import { Base64Url } from '@guarani/utils'

import { InvalidKey, JoseError } from '../../exceptions'
import { JWKAlgorithm, JWKParams } from './_base'

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

  private getPublicParamsAsASN1 (): ASN1 {
    return new ASN1(
      new Nodes.Sequence(
        new Nodes.Integer(Base64Url.decodeInt(this.n)),
        new Nodes.Integer(Base64Url.decodeInt(this.e))
      )
    )
  }

  public get publicKey (): KeyObject {
    const asn1 = this.getPublicParamsAsASN1()

    return createPublicKey({
      key: new Encoders.DER(asn1.data).encode(),
      format: 'der',
      type: 'pkcs1'
    })
  }

  public export (type?: 'pkcs1' | 'pkcs8'): string {
    if (type === 'pkcs1') {
      const asn1 = this.getPublicParamsAsASN1()
      return new Encoders.PEM(asn1.data).encode('RSA PUBLIC KEY')
    }

    if (type === 'pkcs8') {
      const key = this.getPublicParamsAsASN1()
      const asn1 = new ASN1(
        new Nodes.Sequence(
          new Nodes.Sequence(
            new Nodes.ObjectId('1.2.840.113549.1.1.1'),
            new Nodes.Null()
          ),
          new Nodes.BitString(key.data)
        )
      )

      return new Encoders.PEM(asn1.data).encode('PUBLIC KEY')
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

  private getPrivateParamsAsASN1 (): ASN1 {
    return new ASN1(
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
      key: new Encoders.DER(asn1.data).encode(),
      format: 'der',
      type: 'pkcs1'
    })
  }

  public export (type?: 'pkcs1' | 'pkcs8'): string {
    if (type === 'pkcs1') {
      const asn1 = this.getPrivateParamsAsASN1()
      return new Encoders.PEM(asn1.data).encode('RSA PRIVATE KEY')
    }

    if (type === 'pkcs8') {
      const key = this.getPrivateParamsAsASN1()
      const asn1 = new ASN1(
        new Nodes.Sequence(
          new Nodes.Integer(0x00),
          new Nodes.Sequence(
            new Nodes.ObjectId('1.2.840.113549.1.1.1'),
            new Nodes.Null()
          ),
          new Nodes.OctetString(key.data)
        )
      )

      return new Encoders.PEM(asn1.data).encode('PRIVATE KEY')
    }

    throw new JoseError('You MUST provide a valid type argument.')
  }
}
