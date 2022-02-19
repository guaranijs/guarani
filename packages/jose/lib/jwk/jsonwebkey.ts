import { removeNullishValues } from '@guarani/objects'
import { Optional } from '@guarani/types'

import { InvalidJsonWebKeyException } from '../exceptions'

/**
 * Interface defining the supported parameters of a JsonWebKey.
 *
 * The parameters defined here are the default ones defined by
 * {@link https://tools.ietf.org/html/rfc7517 RFC 7517}.
 */
export interface JsonWebKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  readonly kty?: Optional<string>

  /**
   * Defines the usage of the key.
   */
  readonly use?: Optional<string>

  /**
   * Defines the allowed operations to be performed with the key
   */
  readonly key_ops?: Optional<string[]>

  /**
   * Defines the signature or encryption algorithm allowed to use this key.
   */
  readonly alg?: Optional<string>

  /**
   * Defines the ID of the key.
   */
  readonly kid?: Optional<string>

  /**
   * Defines the URL of the X.509 certificate of the key.
   */
  readonly x5u?: Optional<string>

  /**
   * Defines a chain of X.509 certificates of the key.
   */
  readonly x5c?: Optional<string[]>

  /**
   * Defines the SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  readonly x5t?: Optional<string>

  /**
   * Defines the SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  readonly 'x5t#S256'?: Optional<string>

  /**
   * Additional custom parameters.
   */
  readonly [parameter: string]: any
}

export abstract class JsonWebKey implements JsonWebKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  public readonly kty!: string

  /**
   * Defines the usage of the key.
   */
  public readonly use?: Optional<string>

  /**
   * Defines the allowed operations to be performed with the key
   */
  public readonly key_ops?: Optional<string[]>

  /**
   * Defines the signature or encryption algorithm allowed to use this key.
   */
  public readonly alg?: Optional<string>

  /**
   * Defines the ID of the key.
   */
  public readonly kid?: Optional<string>

  /**
   * Defines the URL of the X.509 certificate of the key.
   */
  public readonly x5u?: Optional<string>

  /**
   * Defines a chain of X.509 certificates of the key.
   */
  public readonly x5c?: Optional<string[]>

  /**
   * Defines the SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  public readonly x5t?: Optional<string>

  /**
   * Defines the SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  public readonly 'x5t#S256'?: Optional<string>

  /**
   * Signature of the Constructor of a JSON Web Key.
   *
   * @param params Parameters of the key.
   */
  public constructor(params: Optional<JsonWebKeyParams> = {}) {
    if (typeof params.use !== 'undefined' && typeof params.use !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "use".')
    }

    if (typeof params.key_ops !== 'undefined') {
      if (
        !Array.isArray(params.key_ops) ||
        params.key_ops.some(p => typeof p !== 'string')
      ) {
        throw new InvalidJsonWebKeyException('Invalid parameter "key_ops".')
      }

      if (new Set(params.key_ops).size !== params.key_ops.length) {
        throw new InvalidJsonWebKeyException(
          'Parameter "key_ops" cannot have repeated operations.'
        )
      }
    }

    if (
      typeof params.use !== 'undefined' &&
      typeof params.key_ops !== 'undefined'
    ) {
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
        throw new InvalidJsonWebKeyException(
          'Invalid combination of "use" and "key_ops".'
        )
      }
    }

    if (typeof params.alg !== 'undefined' && typeof params.alg !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "alg".')
    }

    if (typeof params.kid !== 'undefined' && typeof params.kid !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "kid".')
    }

    if (typeof params.x5u !== 'undefined') {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5u".')
    }

    if (typeof params.x5c !== 'undefined') {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5c".')
    }

    if (typeof params.x5t !== 'undefined') {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5t".')
    }

    if (typeof params['x5t#256'] !== 'undefined') {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5t#256".')
    }

    Object.assign(this, removeNullishValues(params))
  }

  /**
   * Generates a new JSON Web Key.
   *
   * @param param Parameter used to generate the JSON Web Key.
   * @param options Optional JSON Web Key Parameters.
   * @returns Generated JSON Web Key.
   */
  public static generate(
    param: any, // eslint-disable-line
    options?: Optional<JsonWebKeyParams> // eslint-disable-line
  ): Promise<JsonWebKey> {
    throw new Error('Cannot call abstract static method "generate".')
  }

  /**
   * Parses a raw key into a JSON Web Key.
   *
   * @param data Data to be parsed.
   * @param options Optional JSON Web Key Parameters.
   * @returns Parsed JSON Web Key.
   */
  public static parse(
    data: Buffer | string, // eslint-disable-line
    options?: Optional<JsonWebKeyParams> // eslint-disable-line
  ): JsonWebKey {
    throw new Error('Cannot call abstract static method "parse".')
  }

  /**
   * Exports the data of the key into an encoded string or bytes array.
   *
   * @param params Parameters specifying the exportation of the key.
   * @returns Encoded key parameters.
   */
  // @ts-expect-error
  // eslint-disable-next-line
  public export(...params: any[]): Buffer | string {}
}
