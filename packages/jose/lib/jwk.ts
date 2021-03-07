/* eslint-disable camelcase */

import { KeyObject } from 'crypto'

import { InvalidKey, UnsupportedAlgorithm } from './exceptions'
import { EC, JWKAlgorithm, JWKAParams, OCT, RSA } from './jwa/jwk'

export interface JWKParams extends JWKAParams {
  use?: string
  key_ops?: string[]
  alg?: string
  kid?: string
  x5u?: string
  x5c?: string[]
  x5t?: string
  'x5t#256'?: string

  // Any custom parameters that are not officialy supported.
  [key: string]: any
}

interface AlgorithmOptions {
  create: (param: any) => JWKAlgorithm,
  load: (data: JWKAParams) => JWKAlgorithm,
  parse: (data: string | Buffer, keyType?: 'public' | 'private') => JWKAlgorithm
}

const SupportedAlgorithms: { [key: string]: AlgorithmOptions } = {
  EC: { create: EC.create, load: EC.load, parse: EC.parse },
  oct: { create: OCT.create, load: OCT.load, parse: OCT.parse },
  RSA: { create: RSA.create, load: RSA.load, parse: RSA.parse }
}

/**
 * Implementation of RFC 7517.
 *
 * It represents the keys used by the application via the algorithms
 * defined at RFC 7518 and implemented as :class:`JWKAlgorithm` in this package.
 *
 * The usage of this representation instead of directly using the key is
 * so that there is a well defined granularity regarding the usage of
 * each key, as well as the allowed operations.
 *
 * It is possible to define an ID for each key as well, which helps identifying
 * the key used at any point in the application.
 */
export class JsonWebKey<KeyAlg extends JWKAParams = JWKParams> implements JWKParams {
  public readonly kty?: string
  public readonly use?: string
  public readonly key_ops?: string[]
  public readonly alg?: string
  public readonly kid?: string
  public readonly x5u?: string
  public readonly x5c?: string[]
  public readonly x5t?: string
  public readonly 'x5t#256'?: string

  public constructor (data: JWKParams & KeyAlg, options: JWKParams = {}) {
    if (data == null || !data) throw new InvalidKey()

    const kty = options.kty ?? data.kty

    if (!(kty in SupportedAlgorithms)) throw new UnsupportedAlgorithm()

    SupportedAlgorithms[kty].load(data)

    const params = { ...data, ...options }

    if (params.use && typeof params.use !== 'string') {
      throw new InvalidKey('Invalid parameter "use".')
    }

    if (params.key_ops) {
      if (!Array.isArray(params.key_ops) || params.key_ops.some(p => typeof p !== 'string')) {
        throw new InvalidKey('Invalid parameter "key_ops".')
      }

      if (new Set(params.key_ops).size !== params.key_ops.length) {
        throw new InvalidKey('Parameter "key_ops" cannot have repeated operations.')
      }
    }

    if (params.use && params.key_ops) {
      const sig = ['sign', 'verify']
      const enc = ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey', 'deriveKey', 'deriveBits']

      if (
        (params.use === 'sig' && params.key_ops.some(p => !sig.includes(p))) ||
        (params.use === 'enc' && params.key_ops.some(p => !enc.includes(p)))
      ) {
        throw new InvalidKey('Invalid combination of "use" and "key_ops".')
      }
    }

    if (params.alg && typeof params.alg !== 'string') {
      throw new InvalidKey('Invalid parameter "alg".')
    }

    if (params.kid && typeof params.kid !== 'string') {
      throw new InvalidKey('Invalid parameter "kid".')
    }

    if (params.x5u) throw new InvalidKey('Unsupported parameter "x5u".')
    if (params.x5c) throw new InvalidKey('Unsupported parameter "x5c".')
    if (params.x5t) throw new InvalidKey('Unsupported parameter "x5t".')
    if (params['x5t#256']) throw new InvalidKey('Unsupported parameter "x5t#256".')

    Object.assign(this, params)
  }

  public static create (kty: 'EC', curve: EC.SupportedCurves, options?: JWKParams): JsonWebKey<EC.PrivateParams>
  public static create (kty: 'oct', size: number, options?: JWKParams): JsonWebKey<OCT.SecretParams>
  public static create (kty: 'RSA', modulusLength: number, options?: JWKParams): JsonWebKey<RSA.PrivateParams>
  public static create (kty: 'EC' | 'oct' | 'RSA', param?: any, options?: JWKParams) {
    const keyAlg = SupportedAlgorithms[kty].create(param)
    return new JsonWebKey({ kty, ...keyAlg }, options)
  }

  public static parse (kty: 'oct', data: string | Buffer): JsonWebKey<OCT.SecretParams>
  public static parse (kty: 'EC', data: string, keyType: 'private'): JsonWebKey<EC.PrivateParams>
  public static parse (kty: 'EC', data: string, keyType: 'public'): JsonWebKey<EC.PublicParams>
  public static parse (kty: 'RSA', data: string, keyType: 'private'): JsonWebKey<RSA.PrivateParams>
  public static parse (kty: 'RSA', data: string, keyType: 'public'): JsonWebKey<RSA.PublicParams>
  public static parse (kty: 'EC' | 'oct' | 'RSA', data: string | Buffer, keyType?: 'private' | 'public') {
    return SupportedAlgorithms[kty].parse(data, keyType)
  }

  public get secretKey (): KeyObject {
    return SupportedAlgorithms[this.kty].load(this).secretKey
  }

  public get publicKey (): KeyObject {
    return SupportedAlgorithms[this.kty].load(this).publicKey
  }

  public get privateKey (): KeyObject {
    return SupportedAlgorithms[this.kty].load(this).privateKey
  }
}
