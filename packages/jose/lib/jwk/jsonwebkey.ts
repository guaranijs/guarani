import { Objects } from '@guarani/utils'

import { InvalidKey } from '../exceptions'

/**
 * Supported JSON Web Key Algorithms.
 */
export type SupportedJWKAlgorithm = 'EC' | 'oct' | 'RSA'

/**
 * Interface defining the supported parameters of a JsonWebKey.
 *
 * The parameters defined here are the default ones defined by
 * {@link https://tools.ietf.org/html/rfc7517|RFC 7517}.
 */
export interface JsonWebKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  readonly kty?: string

  /**
   * Defines the usage of the key.
   */
  readonly use?: string

  /**
   * Defines the allowed operations to be performed with the key
   */
  readonly key_ops?: string[]

  /**
   * Defines the signature or encryption algorithm allowed to use this key.
   */
  readonly alg?: string

  /**
   * Defines the ID of the key.
   */
  readonly kid?: string

  /**
   * Defines the URL of the X.509 certificate of the key.
   */
  readonly x5u?: string

  /**
   * Defines a chain of X.509 certificates of the key.
   */
  readonly x5c?: string[]

  /**
   * Defines the SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  readonly x5t?: string

  /**
   * Defines the SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  readonly 'x5t#S256'?: string

  /**
   * Additional custom parameters.
   */
  readonly [parameter: string]: any
}

export abstract class JsonWebKey implements JsonWebKeyParams {
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
   * Signature of the Constructor of a JSON Web Key.
   *
   * @param params - Parameters of the key.
   */
  public constructor(params: JsonWebKeyParams = {}) {
    if (params.use && typeof params.use !== 'string') {
      throw new InvalidKey('Invalid parameter "use".')
    }

    if (params.key_ops) {
      if (
        !Array.isArray(params.key_ops) ||
        params.key_ops.some(p => typeof p !== 'string')
      ) {
        throw new InvalidKey('Invalid parameter "key_ops".')
      }

      if (new Set(params.key_ops).size !== params.key_ops.length) {
        throw new InvalidKey(
          'Parameter "key_ops" cannot have repeated operations.'
        )
      }
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

    if (params.x5u) {
      throw new InvalidKey('Unsupported parameter "x5u".')
    }

    if (params.x5c) {
      throw new InvalidKey('Unsupported parameter "x5c".')
    }

    if (params.x5t) {
      throw new InvalidKey('Unsupported parameter "x5t".')
    }

    if (params['x5t#256']) {
      throw new InvalidKey('Unsupported parameter "x5t#256".')
    }

    Object.assign(this, Objects.removeNullishValues<JsonWebKeyParams>(params))
  }

  /**
   * Generates a new JSON Web Key.
   *
   * @param param - Parameter used to generate the JSON Web Key.
   * @param options - Optional JSON Web Key Parameters.
   * @returns - Generated JSON Web Key.
   */
  public static generate(
    param: any,
    options?: JsonWebKeyParams
  ): Promise<JsonWebKey> {
    throw new Error('Cannot call abstract static method "generate".')
  }

  /**
   * Parses a raw key into a JSON Web Key.
   *
   * @param data - Data to be parsed.
   * @param options - Optional JSON Web Key Parameters.
   * @returns Parsed JSON Web Key.
   */
  public static parse(
    data: Buffer | string,
    options?: JsonWebKeyParams
  ): JsonWebKey {
    throw new Error('Cannot call abstract static method "parse".')
  }

  /**
   * Exports the data of the key into an encoded string or bytes array.
   *
   * @param params - Parameters specifying the exportation of the key.
   * @returns Encoded key parameters.
   */
  public abstract export(...params: any[]): Buffer | string
}
