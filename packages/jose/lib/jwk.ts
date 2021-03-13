/**
 * Implements the RFC 7517.
 *
 * @module JWK
 */

/* eslint-disable camelcase */

import { KeyObject } from 'crypto'

import { InvalidKey, UnsupportedAlgorithm } from './exceptions'

import {
  ECKey,
  ECParams,
  JWKAParams,
  JWKAlgorithm,
  OCTKey,
  OCTParams,
  RSAKey,
  RSAParams,
  SupportedCurves,
  createEcKey,
  createOctKey,
  createRsaKey,
  parseEcKey,
  parseOctKey,
  parseRsaKey
} from './jwa/jwk'

/**
 * Defines the parameters supported by the JsonWebKey.
 */
export interface JWKParams extends JWKAParams {
  /**
   * Cryptographic Algorithm used by the key.
   */
  kty?: string

  /**
   * Intended use of the Public Key.
   */
  use?: string

  /**
   * Operation(s) for which the key will be used.
   */
  key_ops?: string[]

  /**
   * Algorithm which will use the key.
   */
  alg?: string

  /**
   * Identifies a specific key.
   */
  kid?: string

  /**
   * URI that refers to a resource for an X.509
   * Public Key Certificate or Certificate Chain.
   */
  x5u?: string

  /**
   * Chain of one or more PKIX certificates.
   */
  x5c?: string[]

  /**
   * Base64Url SHA-1 Thumbprint of the DER encoding of an X.509 Certificate.
   */
  x5t?: string

  /**
   * Base64Url SHA-256 Thumbprint of the DER encoding of an X.509 Certificate.
   */
  'x5t#256'?: string

  // Any custom parameter that is not officialy supported.
  [key: string]: any
}

/**
 * Operations performed by the algorithms.
 */
interface AlgorithmOptions {
  create: (param: any) => JWKAlgorithm
  Load: new (data: JWKAParams) => JWKAlgorithm
  parse: (
    data: string,
    keyType?: 'secret' | 'public' | 'private'
  ) => JWKAlgorithm
}

/**
 * Supported algorithms and their respective operations.
 */
const SupportedAlgorithms: { [key: string]: AlgorithmOptions } = {
  EC: { create: createEcKey, Load: ECKey, parse: parseEcKey },
  oct: { create: createOctKey, Load: OCTKey, parse: parseOctKey },
  RSA: { create: createRsaKey, Load: RSAKey, parse: parseRsaKey }
}

/**
 * Implementation of RFC 7517.
 *
 * It represents the keys used by the application via the algorithms
 * defined at RFC 7518 and implemented as `JWKAlgorithm` in this library.
 *
 * The usage of this representation instead of directly using the key is
 * so that there is a well defined granularity regarding the usage of
 * each key, as well as the allowed operations.
 *
 * It is possible to define an ID for each key as well, which helps identifying
 * the key used at any point in the application.
 */
export class JsonWebKey<KeyAlg extends JWKAParams = JWKParams>
  implements JWKParams {
  /**
   * Cryptographic Algorithm used by the key.
   */
  public readonly kty?: string

  /**
   * Intended use of the Public Key.
   */
  public readonly use?: string

  /**
   * Operation(s) for which the key will be used.
   */
  public readonly key_ops?: string[]

  /**
   * Algorithm which will use the key.
   */
  public readonly alg?: string

  /**
   * Identifies a specific key.
   */
  public readonly kid?: string

  /**
   * URI that refers to a resource for an X.509
   * Public Key Certificate or Certificate Chain.
   */
  public readonly x5u?: string

  /**
   * Chain of one or more PKIX certificates.
   */
  public readonly x5c?: string[]

  /**
   * Base64Url SHA-1 Thumbprint of the DER encoding of an X.509 Certificate.
   */
  public readonly x5t?: string

  /**
   * Base64Url SHA-256 Thumbprint of the DER encoding of an X.509 Certificate.
   */
  public readonly 'x5t#256'?: string

  /**
   * Instantiates a new Json Web Key.
   *
   * @param data - Data of the JWK in an object format.
   * @param options - Defines the parameters of the JWK.
   * It overwrites the parameters defined by the key.
   */
  public constructor(data: JWKParams & KeyAlg, options: JWKParams = {}) {
    if (!data) throw new TypeError('Invalid parameter "data".')

    const kty = options.kty ?? data.kty

    if (!(kty in SupportedAlgorithms)) throw new UnsupportedAlgorithm()

    // eslint-disable-next-line no-new
    new SupportedAlgorithms[kty].Load(data)

    const params = { ...data, ...options }

    if (params.use && typeof params.use !== 'string')
      throw new InvalidKey('Invalid parameter "use".')

    if (params.key_ops) {
      if (
        !Array.isArray(params.key_ops) ||
        params.key_ops.some(p => typeof p !== 'string')
      )
        throw new InvalidKey('Invalid parameter "key_ops".')

      if (new Set(params.key_ops).size !== params.key_ops.length)
        throw new InvalidKey(
          'Parameter "key_ops" cannot have repeated operations.'
        )
    }

    if (params.use && params.key_ops) {
      const sig = ['sign', 'verify']
      const enc = [
        'encrypt',
        'decrypt',
        'wrapKey',
        'unwrapKey',
        'deriveKey',
        'deriveBits'
      ]

      if (
        (params.use === 'sig' && params.key_ops.some(p => !sig.includes(p))) ||
        (params.use === 'enc' && params.key_ops.some(p => !enc.includes(p)))
      )
        throw new InvalidKey('Invalid combination of "use" and "key_ops".')
    }

    if (params.alg && typeof params.alg !== 'string')
      throw new InvalidKey('Invalid parameter "alg".')

    if (params.kid && typeof params.kid !== 'string')
      throw new InvalidKey('Invalid parameter "kid".')

    if (params.x5u) throw new InvalidKey('Unsupported parameter "x5u".')

    if (params.x5c) throw new InvalidKey('Unsupported parameter "x5c".')

    if (params.x5t) throw new InvalidKey('Unsupported parameter "x5t".')

    if (params['x5t#256'])
      throw new InvalidKey('Unsupported parameter "x5t#256".')

    Object.assign(this, params)
  }

  /**
   * Creates an Elliptic Curve based JWK.
   *
   * @param kty - Uses `Elliptic Curve`.
   * @param curve - Name of the Curve.
   * @param options - Optional parameters to the key.
   * @returns Elliptic Curve based JWK.
   */
  public static create(
    kty: 'EC',
    curve: SupportedCurves,
    options?: JWKParams
  ): JsonWebKey<ECParams>

  /**
   * Creates an Octet Sequence based JWK.
   *
   * @param kty - Uses `Octet Sequence`.
   * @param size - Size of the secret in bytes.
   * @param options - Optional parameters to the key.
   * @returns Octet Sequence based JWK.
   */
  public static create(
    kty: 'oct',
    size: number,
    options?: JWKParams
  ): JsonWebKey<OCTParams>

  /**
   * Creates an RSA based JWK.
   *
   * @param kty - Uses `RSA`.
   * @param modulusLength - Length of the modulus in bits.
   * @param options - Optional parameters to the key.
   * @returns RSA based JWK.
   */
  public static create(
    kty: 'RSA',
    modulusLength: number,
    options?: JWKParams
  ): JsonWebKey<RSAParams>

  public static create(kty: 'EC' | 'oct' | 'RSA', _: any, options?: JWKParams) {
    const keyAlg = SupportedAlgorithms[kty].create(_)
    return new JsonWebKey({ kty, ...keyAlg }, options)
  }

  /**
   * Parses a Base64 string into an Octet Sequence based JWK.
   *
   * @param kty - Uses `Octet Sequence`.
   * @param data - Base64 string representing the secret.
   * @param keyType - Defines the key as `secret`.
   * @param options - Optional parameters to the key.
   * @returns Octet Sequence based JWK.
   */
  public static parse(
    kty: 'oct',
    data: string,
    keyType: 'secret',
    options?: JWKParams
  ): JsonWebKey<OCTParams>

  /**
   * Parses a PEM string into an Elliptic Curve based JWK.
   *
   * @param kty - Uses `Elliptic Curve`.
   * @param data - PEM encoded string representing the Private Key.
   * @param keyType - Defines the key as `private`.
   * @param options - Optional parameters to the key.
   * @returns Elliptic Curve based JWK.
   */
  public static parse(
    kty: 'EC',
    data: string,
    keyType: 'private',
    options?: JWKParams
  ): JsonWebKey<ECParams>

  /**
   * Parses a PEM string into an Elliptic Curve based JWK.
   *
   * @param kty - Uses `Elliptic Curve`.
   * @param data - PEM encoded string representing the Public Key.
   * @param keyType - Defines the key as `public`.
   * @param options - Optional parameters to the key.
   * @returns Elliptic Curve based JWK.
   */
  public static parse(
    kty: 'EC',
    data: string,
    keyType: 'public',
    options?: JWKParams
  ): JsonWebKey<ECParams>

  /**
   * Parses a PEM string into an RSA based JWK.
   *
   * @param kty - Uses `RSA`.
   * @param data - PEM encoded string representing the Private Key.
   * @param keyType - Defines the key as `private`.
   * @param options - Optional parameters to the key.
   * @returns RSA based JWK.
   */
  public static parse(
    kty: 'RSA',
    data: string,
    keyType: 'private',
    options?: JWKParams
  ): JsonWebKey<RSAParams>

  /**
   * Parses a PEM string into an RSA based JWK.
   *
   * @param kty - Uses `RSA`.
   * @param data - PEM encoded string representing the Public Key.
   * @param keyType - Defines the key as `public`.
   * @param options - Optional parameters to the key.
   * @returns RSA based JWK.
   */
  public static parse(
    kty: 'RSA',
    data: string,
    keyType: 'public',
    options?: JWKParams
  ): JsonWebKey<RSAParams>

  public static parse(
    kty: 'EC' | 'oct' | 'RSA',
    data: string,
    keyType: 'secret' | 'private' | 'public',
    options?: JWKParams
  ) {
    const keyAlg = SupportedAlgorithms[kty].parse(data, keyType)
    return new JsonWebKey({ kty, ...keyAlg }, options)
  }

  /**
   * Exports the secret of an OCTKey as a Base64 string.
   *
   * @returns Base64 encoded secret.
   */
  public export(): string

  /**
   * Exports a PEM string of the PKCS#1 format of an RSA Private Key.
   *
   * @param type - PKCS#1 RSA Private Key.
   * @param keyType - Private Key.
   * @returns PEM string.
   */
  public export(type: 'pkcs1', keyType: 'private'): string

  /**
   * Exports a PEM string of the SEC1 format of an Elliptic Curve Private Key.
   *
   * @param type - SEC1 Elliptic Curve Private Key.
   * @param keyType - Private Key.
   * @returns PEM string.
   */
  public export(type: 'sec1', keyType: 'private'): string

  /**
   * Exports a PEM string of the PKCS#8 format of a Private Key.
   *
   * @param type - PKCS#8 Private Key.
   * @param keyType - Private Key.
   * @returns PEM string.
   */
  public export(type: 'pkcs8', keyType: 'private'): string

  /**
   * Exports a PEM string of the PKCS#1 format of an RSA Public Key.
   *
   * @param type - PKCS#1 RSA Public Key.
   * @param keyType - Public Key.
   * @returns PEM string.
   */
  public export(type: 'pkcs1', keyType: 'public'): string

  /**
   * Exports a PEM string of the SubjectPublicKeyInfo format of a Public Key.
   *
   * @param type - SubjectPublicKeyInfo Public Key.
   * @param keyType - Public Key.
   * @returns PEM string.
   */
  public export(type: 'spki', keyType: 'public'): string

  public export(
    type?: 'pkcs1' | 'pkcs8' | 'sec1' | 'spki',
    keyType?: 'private' | 'public'
  ): string {
    return new SupportedAlgorithms[this.kty].Load(this).export(type, keyType)
  }

  /**
   * Returns a native NodeJS Secret Key Object.
   *
   * @returns Native Secret Key Object.
   */
  public get secretKey(): KeyObject {
    try {
      // @ts-expect-error
      return new SupportedAlgorithms[this.kty].Load(this).getSecretKey()
    } catch {
      throw new InvalidKey('This algorithm does not have a secret key.')
    }
  }

  /**
   * Returns a native NodeJS Public Key Object.
   *
   * @returns Native Public Key Object.
   */
  public get publicKey(): KeyObject {
    try {
      // @ts-expect-error
      return new SupportedAlgorithms[this.kty].Load(this).getPublicKey()
    } catch {
      throw new InvalidKey('This algorithm does not have a public key.')
    }
  }

  /**
   * Returns a native NodeJS Private Key Object.
   *
   * @returns Native Private Key Object.
   */
  public get privateKey(): KeyObject {
    try {
      // @ts-expect-error
      return new SupportedAlgorithms[this.kty].Load(this).getPrivateKey()
    } catch {
      throw new InvalidKey('This algorithm does not have a private key.')
    }
  }
}
