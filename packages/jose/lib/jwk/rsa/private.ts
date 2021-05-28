import { Decoders, Encoders, Nodes } from '@guarani/asn1'
import { Base64Url } from '@guarani/utils'

import { createPrivateKey, generateKeyPairSync, KeyObject } from 'crypto'

import { InvalidKey } from '../../exceptions'
import { KeyOptions, PrivateKey } from '../base'
import { RSAPublicKey, RSAPublicParams } from './public'

/**
 * Representation of the Private Parameters of an `RSA` asymmetric key.
 */
export interface RSAPrivateParams extends RSAPublicParams {
  /**
   * Base64Url representation of the Private Exponent.
   */
  readonly d: string

  /**
   * Base64Url representation of the First Prime.
   */
  readonly p?: string

  /**
   * Base64Url representation of the Second Prime.
   */
  readonly q?: string

  /**
   * Base64Url representation of the CRT's First Exponent.
   */
  readonly dp?: string

  /**
   * Base64Url representation of the CRT's Second Exponent.
   */
  readonly dq?: string

  /**
   * Base64Url representation of the CRT's Coefficient.
   */
  readonly qi?: string

  /**
   * Base64Url representation of the Other Primes.
   */
  readonly oth?: [Readonly<string>?, Readonly<string>?, Readonly<string>?]
}

/**
 * Implementation of the RSA Asymmetric Key Algorithm.
 *
 * This class wraps the RSA Private Key and extends
 * the functionality of the RSA Public Key.
 */
export class RSAPrivateKey
  extends RSAPublicKey
  implements RSAPrivateParams, PrivateKey {
  /**
   * Base64Url representation of the Private Exponent.
   */
  public readonly d: string

  /**
   * Base64Url representation of the First Prime.
   */
  public readonly p: string

  /**
   * Base64Url representation of the Second Prime.
   */
  public readonly q: string

  /**
   * Base64Url representation of the CRT's First Exponent.
   */
  public readonly dp: string

  /**
   * Base64Url representation of the CRT's Second Exponent.
   */
  public readonly dq: string

  /**
   * Base64Url representation of the CRT's Coefficient.
   */
  public readonly qi: string

  /**
   * Instantiantes a new RSA Private Key based on the provided parameters.
   *
   * @param key - Parameters of the key.
   * @param options - Defines the parameters of the JWK.
   */
  public constructor(key: RSAPrivateParams, options: KeyOptions = {}) {
    super(key, options)

    if (typeof key.d !== 'string' || key.d.length === 0)
      throw new InvalidKey('Invalid parameter "d".')

    if (typeof key.p !== 'string' || key.p.length === 0)
      throw new InvalidKey('Invalid parameter "p".')

    if (typeof key.q !== 'string' || key.q.length === 0)
      throw new InvalidKey('Invalid parameter "q".')

    if (typeof key.dp !== 'string' || key.dp.length === 0)
      throw new InvalidKey('Invalid parameter "dp".')

    if (typeof key.dq !== 'string' || key.dq.length === 0)
      throw new InvalidKey('Invalid parameter "dq".')

    if (typeof key.qi !== 'string' || key.qi.length === 0)
      throw new InvalidKey('Invalid parameter "qi".')

    this.d = key.d
    this.p = key.p
    this.q = key.q
    this.dp = key.dp
    this.dq = key.dq
    this.qi = key.qi
  }

  /**
   * Returns an instance of the NodeJS native private key.
   *
   * @returns Native Private Key Object.
   */
  public get privateKey(): KeyObject {
    const privateParams = new Nodes.Sequence(
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

    return createPrivateKey({
      key: privateParams.encode(),
      format: 'der',
      type: 'pkcs1'
    })
  }
}

/**
 * Interface describing the return of the RSA Key Generation.
 */
interface RSAKeyPair {
  /**
   * RSA Public Key.
   */
  readonly publicKey: RSAPublicKey

  /**
   * RSA Private Key.
   */
  readonly privateKey: RSAPrivateKey
}

/**
 * Creates a new RSA Private Key.
 *
 * @param modulusLength - Length of the Modulus of the Key in bits.
 * @param options - Defines the parameters of the JWK.
 * @returns RSA Key Pair.
 */
export function createRsaKeyPair(
  modulusLength: number,
  options?: KeyOptions
): RSAKeyPair {
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

  return {
    publicKey: new RSAPublicKey({ n, e }, options),
    privateKey: new RSAPrivateKey({ n, e, d, p, q, dp, dq, qi }, options)
  }
}

/**
 * Parses a PEM encoded RSA Private Key.
 *
 * @param pem - PEM representation of the RSA Private Key.
 * @param options - Defines the parameters of the JWK.
 * @returns Instance of an RSAPrivateKey.
 */
export function parseRsaPrivateKey(
  pem: string,
  options?: KeyOptions
): RSAPrivateKey {
  if (typeof pem !== 'string') throw new TypeError('Invalid parameter "pem".')

  const key = createPrivateKey(pem)
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

  return new RSAPrivateKey({ n, e, d, p, q, dp, dq, qi }, options)
}

/**
 * Returns a PEM representation of the Private Key
 * that contains only the parameters of the Key.
 *
 * @param key - RSA Private Key to be exported.
 * @param format - ASN.1 Syntax Tree representation of the Private Key.
 * @returns PEM encoded PKCS#1 RSA Private Key.
 *
 * @example
 * ```
 * > const pkcs1 = exportRsaPrivateKey(rsaPrivateKey, 'pkcs1')
 * > pkcs1
 * '-----BEGIN RSA PRIVATE KEY-----\n' +
 * '<Base64 representation...>\n' +
 * '-----END RSA PRIVATE KEY-----\n'
 * ```
 */
export function exportRsaPrivateKey(key: RSAPrivateKey, format: 'pkcs1'): string

/**
 * Returns a PEM representation of the Private Key enveloped
 * in a PKCS#8 object containing all the parameters of the key.
 *
 * @param key - RSA Private Key to be exported.
 * @param format - ASN.1 Syntax Tree representation of the Private Key.
 * @returns PEM encoded PKCS#8 RSA Private Key.
 *
 * @example
 * ```
 * > const pkcs8 = exportRsaPrivateKey(rsaPrivateKey, 'pkcs8')
 * > pkcs8
 * '-----BEGIN PRIVATE KEY-----\n' +
 * '<Base64 representation...>\n' +
 * '-----END PRIVATE KEY-----\n'
 * ```
 */
export function exportRsaPrivateKey(key: RSAPrivateKey, format: 'pkcs8'): string

export function exportRsaPrivateKey(
  key: RSAPrivateKey,
  format: 'pkcs1' | 'pkcs8'
): string {
  if (!(key instanceof RSAPrivateKey))
    throw new TypeError('Invalid parameter "key".')

  const privateParams = new Nodes.Sequence(
    new Nodes.Integer(0x00),
    new Nodes.Integer(Base64Url.decodeInt(key.n)),
    new Nodes.Integer(Base64Url.decodeInt(key.e)),
    new Nodes.Integer(Base64Url.decodeInt(key.d)),
    new Nodes.Integer(Base64Url.decodeInt(key.p)),
    new Nodes.Integer(Base64Url.decodeInt(key.q)),
    new Nodes.Integer(Base64Url.decodeInt(key.dp)),
    new Nodes.Integer(Base64Url.decodeInt(key.dq)),
    new Nodes.Integer(Base64Url.decodeInt(key.qi))
  )

  if (format === 'pkcs1') return Encoders.PEM(privateParams, 'RSA PRIVATE KEY')

  if (format === 'pkcs8') {
    const asn1 = new Nodes.Sequence(
      new Nodes.Integer(0x00),
      new Nodes.Sequence(
        new Nodes.ObjectId('1.2.840.113549.1.1.1'),
        new Nodes.Null()
      ),
      new Nodes.OctetString(privateParams.encode())
    )

    return Encoders.PEM(asn1, 'PRIVATE KEY')
  }

  throw new TypeError('Invalid parameter "format".')
}
