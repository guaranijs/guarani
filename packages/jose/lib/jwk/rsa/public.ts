import { Decoders, Encoders, Nodes } from '@guarani/asn1'
import { Base64Url } from '@guarani/utils'

import { createPublicKey, KeyObject } from 'crypto'

import { InvalidKey } from '../../exceptions'
import { JsonWebKey, KeyOptions, PublicKey } from '../base'

/**
 * Representation of the Public Parameters of an `RSA` asymmetric key.
 */
export interface RSAPublicParams extends KeyOptions {
  /**
   * Base64Url representation of the Modulus.
   */
  n: string

  /**
   * Base64Url representation of the Public Exponent.
   */
  e: string
}

/**
 * Implementation of the RSA Asymmetric Key Algorithm.
 *
 * This class wraps the RSA Public Key.
 */
export class RSAPublicKey extends JsonWebKey implements PublicKey {
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
   * Instantiantes a new RSA Public Key based on the provided parameters.
   *
   * @param key - Parameters of the key.
   * @param options - Defines the parameters of the JWK.
   */
  public constructor(key: RSAPublicParams, options: KeyOptions = {}) {
    const params = { ...key, ...options }

    super(params)

    if (params.kty && params.kty !== 'RSA')
      throw new InvalidKey(
        `Invalid parameter "kty". Expected "RSA", got "${params.kty}".`
      )

    if (typeof key.n !== 'string')
      throw new InvalidKey('Invalid parameter "n".')

    if (Base64Url.bufferLength(key.n) < 256)
      throw new InvalidKey('The modulus MUST have AT LEAST 2048 bits.')

    if (typeof key.e !== 'string' || key.e.length === 0)
      throw new InvalidKey('Invalid parameter "e".')

    this.kty = 'RSA'
    this.n = key.n
    this.e = key.e
  }

  /**
   * Returns an instance of the NodeJS native Public Key.
   *
   * @returns Native Public Key Object.
   */
  public get publicKey(): KeyObject {
    const publicParams = new Nodes.Sequence(
      new Nodes.Integer(Base64Url.decodeInt(this.n)),
      new Nodes.Integer(Base64Url.decodeInt(this.e))
    )

    return createPublicKey({
      key: publicParams.encode(),
      format: 'der',
      type: 'pkcs1'
    })
  }
}

/**
 * Parses a PEM encoded RSA Public Key.
 *
 * @param data - PEM representation of the RSA Public Key.
 * @param options - Defines the parameters of the JWK.
 * @returns Instance of an RSAPublicKey.
 */
export function parseRsaPublicKey(
  data: string,
  options?: KeyOptions
): RSAPublicKey {
  if (typeof data !== 'string') throw new TypeError('Invalid parameter "data".')

  const key = createPublicKey(data)
  const decoder = Decoders.DER(
    key.export({ format: 'der', type: 'pkcs1' })
  ).sequence()

  const n = Base64Url.encodeInt(decoder.integer())
  const e = Base64Url.encodeInt(decoder.integer())

  return new RSAPublicKey({ n, e }, options)
}

/**
 * Returns a PEM representation of the Public Key
 * that contains only the parameters of the Key.
 *
 * @param key - RSA Public Key to be exported.
 * @param format - ASN.1 Syntax Tree representation of the Public Key.
 * @returns PEM encoded PKCS#1 RSA Public Key.
 *
 * @example
 * ```
 * > const pkcs1 = exportRsaPublicKey(rsaPublicKey, 'pkcs1')
 * > pkcs1
 * '-----BEGIN RSA PUBLIC KEY-----\n' +
 * '<Base64 representation...>\n' +
 * '-----END RSA PUBLIC KEY-----\n'
 * ```
 */
export function exportRsaPublicKey(key: RSAPublicKey, format: 'pkcs1'): string

/**
 * Returns a PEM representation of the Public Key enveloped
 * in an X.509 SubjectPublicKeyInfo containing the Modulus
 * and the Public Exponent of the Key.
 *
 * @param key - RSA Public Key to be exported.
 * @param format - ASN.1 Syntax Tree representation of the Public Key.
 * @returns PEM encoded SPKI RSA Public Key.
 *
 * @example
 * ```
 * > const spki = exportRsaPublicKey(rsaPublicKey, 'spki')
 * > spki
 * '-----BEGIN PUBLIC KEY-----\n' +
 * '<Base64 representation...>\n' +
 * '-----END PUBLIC KEY-----\n'
 * ```
 */
export function exportRsaPublicKey(key: RSAPublicKey, format: 'spki'): string

export function exportRsaPublicKey(
  key: RSAPublicKey,
  format: 'pkcs1' | 'spki'
): string {
  if (!(key instanceof RSAPublicKey))
    throw new TypeError('Invalid parameter "key".')

  const publicParams = new Nodes.Sequence(
    new Nodes.Integer(Base64Url.decodeInt(key.n)),
    new Nodes.Integer(Base64Url.decodeInt(key.e))
  )

  if (format === 'pkcs1') return Encoders.PEM(publicParams, 'RSA PUBLIC KEY')

  if (format === 'spki') {
    const asn1 = new Nodes.Sequence(
      new Nodes.Sequence(
        new Nodes.ObjectId('1.2.840.113549.1.1.1'),
        new Nodes.Null()
      ),
      new Nodes.BitString(publicParams.encode())
    )

    return Encoders.PEM(asn1, 'PUBLIC KEY')
  }

  throw new TypeError('Invalid parameter "format".')
}
