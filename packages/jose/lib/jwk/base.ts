/* eslint-disable camelcase */

import { Objects } from '@guarani/utils'

import { KeyObject } from 'crypto'

import { InvalidKey } from '../exceptions'

/**
 * Interface defining the supported parameters of a JsonWebKey.
 *
 * The parameters defined here are the default ones defined by
 * {@link https://tools.ietf.org/html/rfc7517|RFC 7517}.
 */
export interface KeyOptions {
  /**
   * Key type representing the algorithm of the key.
   */
  kty?: string

  /**
   * Defines the usage of the key.
   */
  use?: string

  /**
   * Defines the allowed operations to be performed with the key
   */
  key_ops?: string[]

  /**
   * Defines the signature or encryption algorithm allowed to use this key.
   */
  alg?: string

  /**
   * Defines the ID of the key.
   */
  kid?: string

  /**
   * Defines the URL of the X.509 certificate of the key.
   */
  x5u?: string

  /**
   * Defines a chain of X.509 certificates of the key.
   */
  x5c?: string[]

  /**
   * Defines the SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  x5t?: string

  /**
   * Defines the SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  'x5t#S256'?: string
}

/**
 * Base class for the implementation of JWK Algorithms.
 *
 * This base class provides validation for the common parameters defined by
 * {@link https://tools.ietf.org/html/rfc7517|RFC 7517}.
 *
 * Any custom key algorithm **MUST** subclass this base class **AND** implement
 * one of the `SecretKey`, `PublicKey` or `PrivateKey` interfaces. Doing so
 * guarantees that the algorithm will be compatible and understood by `Guarani`.
 */
export abstract class JsonWebKey implements KeyOptions {
  /**
   * Key type representing the algorithm of the key.
   */
  public abstract readonly kty: string

  /**
   * Defines the usage of the key.
   */
  public readonly use?: string

  /**
   * Defines the allowed operations to be performed with the key
   */
  public readonly key_ops?: string[]

  /**
   * Defines the signature or encryption algorithm allowed to use this key.
   */
  public readonly alg?: string

  /**
   * Defines the ID of the key.
   */
  public readonly kid?: string

  /**
   * Defines the URL of the X.509 certificate of the key.
   */
  public readonly x5u?: string

  /**
   * Defines a chain of X.509 certificates of the key.
   */
  public readonly x5c?: string[]

  /**
   * Defines the SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  public readonly x5t?: string

  /**
   * Defines the SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  public readonly 'x5t#S256'?: string

  /**
   * Validates the common parameters of the JWK Algorithms.
   *
   * @param params - Defines the parameters of the JWK.
   */
  public constructor(params?: KeyOptions) {
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

    Object.assign(this, Objects.removeNullishValues(params))
  }
}

/**
 * Signatures of Symmetric Secret Keys.
 */
export interface SecretKey {
  /**
   * Native key used by the other algorithms such as JWS and JWE.
   */
  secretKey: KeyObject
}

/**
 * Signatures of Asymmetric Public Keys.
 */
export interface PublicKey {
  /**
   * Native key used by the other algorithms such as JWS and JWE.
   */
  publicKey: KeyObject
}

/**
 * Signatures of Asymmetric Private Keys.
 */
export interface PrivateKey {
  /**
   * Native key used by the other algorithms such as JWS and JWE.
   */
  privateKey: KeyObject
}
