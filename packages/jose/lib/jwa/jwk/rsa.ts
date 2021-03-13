import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  KeyObject
} from 'crypto'

import { Decoders, Encoders, Nodes } from '@guarani/asn1'
import { Base64Url } from '@guarani/utils'

import { InvalidKey, JoseError } from '../../exceptions'
import { AsymmetricKey, JWKAlgorithm, JWKAParams } from './algorithm'

/**
 * Representation of the parameters of an `RSA` asymmetric key.
 */
export interface RSAParams extends JWKAParams {
  /**
   * Base64Url representation of the Modulus.
   */
  n: string

  /**
   * Base64Url representation of the Public Exponent.
   */
  e: string

  /**
   * Base64Url representation of the Private Exponent.
   */
  d?: string

  /**
   * Base64Url representation of the First Prime.
   */
  p?: string

  /**
   * Base64Url representation of the Second Prime.
   */
  q?: string

  /**
   * Base64Url representation of the CRT's First Exponent.
   */
  dp?: string

  /**
   * Base64Url representation of the CRT's Second Exponent.
   */
  dq?: string

  /**
   * Base64Url representation of the CRT's Coefficient.
   */
  qi?: string

  /**
   * Base64Url representation of the Other Primes.
   */
  oth?: [string?, string?, string?]
}

/**
 * Implementation of the RSA Asymmetric Key Algorithm.
 *
 * This class wraps both a Public Key and a Private Key.
 *
 * The Public Key is always represented, while the Private Key
 * is only represented if it is explicitly instantiated as so.
 */
export class RSAKey extends JWKAlgorithm implements AsymmetricKey, RSAParams {
  /**
   * The type of the key.
   */
  public readonly kty: 'RSA'

  /**
   * Base64Url representation of the Modulus.
   */
  public readonly n: string

  /**
   * Base64Url representation of the Public Exponent.
   */
  public readonly e: string

  /**
   * Base64Url representation of the Private Exponent.
   */
  public readonly d?: string

  /**
   * Base64Url representation of the First Prime.
   */
  public readonly p?: string

  /**
   * Base64Url representation of the Second Prime.
   */
  public readonly q?: string

  /**
   * Base64Url representation of the CRT's First Exponent.
   */
  public readonly dp?: string

  /**
   * Base64Url representation of the CRT's Second Exponent.
   */
  public readonly dq?: string

  /**
   * Base64Url representation of the CRT's Coefficient.
   */
  public readonly qi?: string

  /**
   * Instantiantes a new RSAKey based on the provided parameters.
   *
   * @param data - Data of the key. If the key is public, only the parameters
   * `kty`, `n` and `e` are required. If it is private, **ALL** the parameters
   * are required.
   */
  public constructor(data: RSAParams) {
    super(data)

    if (data.kty !== 'RSA')
      throw new InvalidKey(
        `Invalid parameter "kty". Expected "RSA", got "${data.kty}".`
      )

    if (typeof data.n !== 'string')
      throw new InvalidKey('Invalid parameter "n".')

    if (Base64Url.bufferLength(data.n) < 256)
      throw new InvalidKey('The modulus MUST have AT LEAST 2048 bits.')

    if (typeof data.e !== 'string' || data.e.length === 0)
      throw new InvalidKey('Invalid parameter "e".')

    this.n = data.n
    this.e = data.e

    if (data.d) {
      if (typeof data.d !== 'string' || data.d.length === 0)
        throw new InvalidKey('Invalid parameter "d".')

      if (typeof data.p !== 'string' || data.p.length === 0)
        throw new InvalidKey('Invalid parameter "p".')

      if (typeof data.q !== 'string' || data.q.length === 0)
        throw new InvalidKey('Invalid parameter "q".')

      if (typeof data.dp !== 'string' || data.dp.length === 0)
        throw new InvalidKey('Invalid parameter "dp".')

      if (typeof data.dq !== 'string' || data.dq.length === 0)
        throw new InvalidKey('Invalid parameter "dq".')

      if (typeof data.qi !== 'string' || data.qi.length === 0)
        throw new InvalidKey('Invalid parameter "qi".')

      this.d = data.d
      this.p = data.p
      this.q = data.q
      this.dp = data.dp
      this.dq = data.dq
      this.qi = data.qi
    }
  }

  /**
   * Returns an ASN.1 Syntax Tree of the PKCS#1 Public Key.
   *
   * @returns ASN.1 Syntax Tree of the PKCS#1 Public Key.
   */
  private getPublicParamsAsASN1(): Nodes.Node {
    return new Nodes.Sequence(
      new Nodes.Integer(Base64Url.decodeInt(this.n)),
      new Nodes.Integer(Base64Url.decodeInt(this.e))
    )
  }

  /**
   * Returns an ASN.1 Syntax Tree of the PKCS#1 Private Key.
   *
   * @returns ASN.1 Syntax Tree of the PKCS#1 Private Key.
   */
  private getPrivateParamsAsASN1(): Nodes.Node {
    return new Nodes.Sequence(
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
      type: 'pkcs1'
    })
  }

  /**
   * Returns an instance of the NodeJS native private key.
   *
   * @returns Native Private Key Object.
   */
  public getPrivateKey?(): KeyObject {
    if (!this.d) throw new JoseError('No private key found.')

    return createPrivateKey({
      key: this.getPrivateParamsAsASN1().encode(),
      format: 'der',
      type: 'pkcs1'
    })
  }

  /**
   * Returns a PEM representation of the Public Key.
   *
   * @param type - ASN.1 Syntax Tree representation of the Public Key.
   * @param keyType - Defines the key type as `public`.
   * @returns PEM encoded Public Key.
   */
  public export(type: 'pkcs1' | 'spki', keyType: 'public'): string

  /**
   * Returns a PEM representation of the Private Key.
   *
   * @param type - ASN.1 Syntax Tree representation of the Private Key.
   * @param keyType - Defines the key type as `private`.
   * @returns PEM encoded Private Key.
   */
  public export(type: 'pkcs1' | 'pkcs8', keyType: 'private'): string

  public export(
    type: 'pkcs1' | 'pkcs8' | 'spki',
    keyType: 'private' | 'public'
  ): string {
    return {
      private: {
        pkcs1: () =>
          Encoders.PEM(this.getPrivateParamsAsASN1(), 'RSA PRIVATE KEY'),
        pkcs8: () => {
          const key = this.getPrivateParamsAsASN1()
          const asn1 = new Nodes.Sequence(
            new Nodes.Integer(0x00),
            new Nodes.Sequence(
              new Nodes.ObjectId('1.2.840.113549.1.1.1'),
              new Nodes.Null()
            ),
            new Nodes.OctetString(key.encode())
          )
          return Encoders.PEM(asn1, 'PRIVATE KEY')
        }
      },
      public: {
        pkcs1: () =>
          Encoders.PEM(this.getPublicParamsAsASN1(), 'RSA PUBLIC KEY'),
        spki: () => {
          const key = this.getPublicParamsAsASN1()
          const asn1 = new Nodes.Sequence(
            new Nodes.Sequence(
              new Nodes.ObjectId('1.2.840.113549.1.1.1'),
              new Nodes.Null()
            ),
            new Nodes.BitString(key.encode())
          )
          return Encoders.PEM(asn1, 'PUBLIC KEY')
        }
      }
    }[keyType][type]()
  }
}

/**
 * Creates a new RSA Private Key.
 *
 * @param modulusLength - Length of the Modulus of the Key in bits.
 * @returns Instance of an RSAKey.
 */
export function createRsaKey(modulusLength: number): RSAKey {
  if (!Number.isInteger(modulusLength))
    throw new InvalidKey('Invalid modulus length.')

  if (modulusLength < 2048)
    throw new InvalidKey('The modulus MUST be AT LEAST 2048 bits long.')

  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength,
    publicExponent: 65537
  })
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

  return new RSAKey({ kty: 'RSA', n, e, d, p, q, dp, dq, qi })
}

/**
 * Parses a PEM encoded Public Key.
 *
 * @param data - PEM representation of the Public Key.
 * @param keyType - Defines the key type as `public`.
 * @returns Instance of an RSAKey.
 */
export function parseRsaKey(data: string, keyType: 'public'): RSAKey

/**
 * Parses a PEM encoded Private Key.
 *
 * @param data - PEM representation of the Private Key.
 * @param keyType - Defines the key type as `private`.
 * @returns Instance of an RSAKey.
 */
export function parseRsaKey(data: string, keyType: 'private'): RSAKey

export function parseRsaKey(
  data: string,
  keyType: 'public' | 'private'
): RSAKey {
  if (typeof data !== 'string') throw new TypeError('Invalid parameter "data".')

  if (keyType === 'public') {
    const key = createPublicKey(data)
    const decoder = Decoders.DER(
      key.export({ format: 'der', type: 'pkcs1' })
    ).sequence()

    const n = Base64Url.encodeInt(decoder.integer())
    const e = Base64Url.encodeInt(decoder.integer())

    return new RSAKey({ kty: 'RSA', n, e })
  }

  if (keyType === 'private') {
    const key = createPrivateKey(data)
    const decoder = Decoders.DER(
      key.export({ format: 'der', type: 'pkcs1' })
    ).sequence()

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

    return new RSAKey({ kty: 'RSA', n, e, d, p, q, dp, dq, qi })
  }

  throw new TypeError('Invalid parameter "keyType".')
}
