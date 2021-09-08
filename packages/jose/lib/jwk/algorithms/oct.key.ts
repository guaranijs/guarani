import {
  base64toBase64Url,
  base64UrlDecode,
  base64UrlEncode,
  base64UrltoBase64
} from '@guarani/utils'

import { randomBytes } from 'crypto'
import { promisify } from 'util'

import { InvalidKey } from '../../exceptions'
import {
  JsonWebKey,
  JsonWebKeyParams,
  SupportedJWKAlgorithm
} from '../jsonwebkey'

const randomBytesAsync = promisify(randomBytes)

/**
 * Representation of the parameters of an **oct** Symmetric Key.
 */
export interface OctKeyParams extends JsonWebKeyParams {
  /**
   * Base64Url string representation of the secret.
   */
  readonly k: string
}

/**
 * Implementation of the `oct` Symmetric Key.
 *
 * In this implementation, the same secret is used to perform
 * all of the operations.
 *
 * It is **NOT RECOMMENDED** to disclose this type of key in a
 * **JSON Web Keyset (JWKS)**, since it can lead to security issues.
 */
export class OctKey extends JsonWebKey implements OctKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  public readonly kty: SupportedJWKAlgorithm

  /**
   * Base64Url string representation of the secret.
   */
  public readonly k: string

  /**
   * Instantiates an OctKey based on the provided parameters.
   *
   * @param key Parameters of the key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: OctKeyParams, options: JsonWebKeyParams = {}) {
    const params: OctKeyParams = { ...key, ...options }

    super(params)

    if (params.kty != null && params.kty !== 'oct') {
      throw new InvalidKey(
        `Invalid parameter "kty". Expected "oct", got "${params.kty}".`
      )
    }

    if (params.k == null || typeof params.k !== 'string') {
      throw new InvalidKey('Invalid parameter "k".')
    }

    this.kty = 'oct'
    this.k = params.k
  }

  /**
   * Creates a new OctKey.
   *
   * @param size Size of the secret in bytes.
   * @param options Optional JSON Web Key Parameters.
   * @returns Instance of an OctKey.
   */
  public static async generate(
    size: number,
    options?: JsonWebKeyParams
  ): Promise<OctKey> {
    if (!Number.isInteger(size)) {
      throw new TypeError('The key size MUST be a valid integer.')
    }

    if (size < 1) {
      throw new InvalidKey('Invalid key size.')
    }

    const secret = base64UrlEncode(await randomBytesAsync(size))

    return new OctKey({ k: secret }, options)
  }

  /**
   * Parses a Binary encoded Secret.
   *
   * @param secret Binary representation of the Secret.
   * @param options Optional JSON Web Key Parameters.
   * @returns Instance of an OctKey.
   */
  public static parse(secret: Buffer, options?: JsonWebKeyParams): OctKey

  /**
   * Parses a Base64 encoded Secret.
   *
   * @param secret Base64 representation of the Secret.
   * @param options Optional JSON Web Key Parameters.
   * @returns Instance of an OctKey.
   */
  public static parse(secret: string, options?: JsonWebKeyParams): OctKey

  public static parse(
    secret: Buffer | string,
    options?: JsonWebKeyParams
  ): OctKey {
    if (!secret || (!Buffer.isBuffer(secret) && typeof secret !== 'string')) {
      throw new TypeError('Invalid Secret.')
    }

    const parsedSecret = Buffer.isBuffer(secret)
      ? base64UrlEncode(secret)
      : base64toBase64Url(secret)

    return new OctKey({ k: parsedSecret }, options)
  }

  /**
   * Returns a Buffer object of the secret.
   *
   * @param format Format of the exported secret.
   * @returns Binary encoded secret.
   */
  public export(format: 'binary'): Buffer

  /**
   * Returns a Base64 encoded string of the secret.
   *
   * @param format Format of the exported secret.
   * @returns Base64 encoded secret.
   */
  public export(format: 'base64'): string

  public export(format: 'binary' | 'base64'): Buffer | string {
    if (format !== 'binary' && format !== 'base64') {
      throw new Error(`Unsupported format "${format}".`)
    }

    return format === 'binary'
      ? base64UrlDecode(this.k)
      : base64UrltoBase64(this.k)
  }
}
