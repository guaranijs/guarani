import { createSecretKey, KeyObject, randomBytes } from 'crypto'

import { Base64Url } from '@guarani/utils'

import { InvalidKey } from '../../exceptions'
import { JWKAlgorithm, JWKAParams, SymmetricKey } from './algorithm'

/**
 * Representation of the parameters of an `oct` symmetric key.
 */
export interface OCTParams extends JWKAParams {
  /**
   * Base64Url representation of the secret.
   */
  k: string
}

/**
 * Implementation of a symmetric key.
 *
 * In this implementation, the same secret is used to perform
 * all of the operations.
 *
 * It is **NOT RECOMMENDED** to disclose this type of key in a
 * Json Web Key Set (JWKS), since it **COULD** lead to security issues.
 */
export class OCTKey extends JWKAlgorithm implements SymmetricKey, OCTParams {
  /**
   * The type of the key.
   */
  public readonly kty: 'oct'

  /**
   * Base64Url string representation of the secret.
   */
  public readonly k: string

  /**
   * Instantiates an OCTKey based on the provided secret.
   *
   * @param data - Parameters of the key.
   */
  public constructor(data: OCTParams) {
    super(data)

    if (data.kty !== 'oct')
      throw new InvalidKey(
        `Invalid parameter "kty". Expected "oct", got "${data.kty}".`
      )

    if (typeof data.k !== 'string')
      throw new InvalidKey('Invalid parameter "k".')

    if (Base64Url.decode(data.k).length < 32)
      throw new InvalidKey('The key size MUST be AT LEAST 32 bytes.')

    this.k = data.k
  }

  /**
   * Returns an instance of the native NodeJS secret key.
   *
   * @returns Native Secret Key Object.
   */
  public getSecretKey(): KeyObject {
    return createSecretKey(Base64Url.decode(this.k))
  }

  /**
   * Returns a Base64 encoded string of the secret.
   *
   * @returns Base64 encoded secret.
   */
  public export(): string {
    return Base64Url.toBase64(this.k)
  }
}

/**
 * Creates a new OCTKey.
 *
 * @param size - Size of the secret in bytes.
 * @returns Instance of an OCTKey.
 */
export function createOctKey(size: number): OCTKey {
  if (!Number.isInteger(size))
    throw new TypeError('The key size MUST be a valid integer.')

  if (size < 32) throw new InvalidKey('The key size MUST be AT LEAST 32 bytes.')

  const secret = Base64Url.encode(randomBytes(size))

  return new OCTKey({ kty: 'oct', k: secret })
}

/**
 * Parses a Base64 string and returns an OCTKey.
 *
 * @param data - Base64 string to be parsed.
 * @returns Instance of an OCTKey based on the provided secret.
 */
export function parseOctKey(data: string): OCTKey {
  if (typeof data !== 'string')
    throw new TypeError('The secret MUST be a Base64 string.')

  return new OCTKey({ kty: 'oct', k: Base64Url.fromBase64(data) })
}
