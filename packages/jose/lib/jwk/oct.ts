import { Base64Url } from '@guarani/utils'

import { createSecretKey, KeyObject, randomBytes } from 'crypto'

import { InvalidKey } from '../exceptions'
import { JsonWebKey, KeyOptions, SecretKey } from './base'

/**
 * Representation of the parameters of an `oct` symmetric key.
 */
export interface OCTSecretParams extends KeyOptions {
  /**
   * Base64Url representation of the secret.
   */
  k: string
}

/**
 * Implementation of an `oct` symmetric key.
 *
 * In this implementation, the same secret is used to perform
 * all of the operations.
 *
 * It is **NOT RECOMMENDED** to disclose this type of key in a
 * Json Web Key Set (JWKS), since it **COULD** lead to security issues.
 */
export class OCTSecretKey
  extends JsonWebKey
  implements OCTSecretParams, SecretKey {
  /**
   * The type of the key.
   */
  public readonly kty: 'oct'

  /**
   * Base64Url string representation of the secret.
   */
  public readonly k: string

  /**
   * Instantiates an OCTSecretKey based on the provided secret.
   *
   * @param key - Parameters of the key.
   * @param options - Defines the parameters of the JWK.
   */
  public constructor(key: OCTSecretParams, options: KeyOptions = {}) {
    const params = { ...key, ...options }

    super(params)

    if (params.kty && params.kty !== 'oct')
      throw new InvalidKey(
        `Invalid parameter "kty". Expected "oct", got "${params.kty}".`
      )

    if (typeof params.k !== 'string')
      throw new InvalidKey('Invalid parameter "k".')

    if (Base64Url.decode(params.k).length < 32)
      throw new InvalidKey('The key size MUST be AT LEAST 32 bytes.')

    this.kty = 'oct'
    this.k = params.k
  }

  /**
   * Returns an instance of the native NodeJS secret key.
   *
   * @returns Native Secret Key Object.
   */
  public get secretKey(): KeyObject {
    return createSecretKey(Base64Url.decode(this.k))
  }
}

/**
 * Creates a new OCTSecretKey.
 *
 * @param size - Size of the secret in bytes.
 * @param options - Defines the parameters of the JWK.
 * @returns Instance of an OCTSecretKey.
 */
export function createOctSecretKey(
  size: number,
  options?: KeyOptions
): OCTSecretKey {
  if (!Number.isInteger(size))
    throw new TypeError('The key size MUST be a valid integer.')

  if (size < 32) throw new InvalidKey('The key size MUST be AT LEAST 32 bytes.')

  const secret = Base64Url.encode(randomBytes(size))

  return new OCTSecretKey({ k: secret }, options)
}

/**
 * Parses a Base64 secret and returns an OCTSecretKey.
 *
 * @param secret - Base64 secret to be parsed.
 * @param options - Defines the parameters of the JWK.
 * @returns Instance of an OCTSecretKey based on the provided secret.
 */
export function parseOctSecretKey(
  secret: string,
  options?: KeyOptions
): OCTSecretKey {
  if (typeof secret !== 'string')
    throw new TypeError('Invalid parameter "secret".')

  return new OCTSecretKey({ k: Base64Url.fromBase64(secret) }, options)
}

/**
 * Returns a Base64 encoded string of the secret.
 *
 * @param key - OCTSecretKey to be exported.
 * @returns Base64 encoded secret.
 */
export function exportOctSecretKey(key: OCTSecretKey): string {
  if (!(key instanceof OCTSecretKey))
    throw new TypeError('Invalid parameter "key".')

  return Base64Url.toBase64(key.k)
}
