import { Nullable } from '@guarani/types'

import { InvalidKey } from '../../exceptions'
import { JsonWebKey } from '../../jwk'
import { SupportedHash } from '../../types'

/**
 * Implementation of the Section 3 of RFC 7518.
 *
 * This class provides the expected method signatures
 * that will be used throughout the package.
 *
 * All JWS Algorithms **MUST** inherit from this class and
 * implement its methods.
 */
export abstract class JWSAlgorithm {
  /**
   * Denotes the type of the JSON Web Key supported by this algorithm.
   */
  public abstract readonly kty: Nullable<string>

  /**
   * Instantiates a new JWS Algorithm to sign and verify the messages.
   *
   * @param hash Hash algorithm used to sign and verify the messages.
   * @param algorithm Name of the algorithm.
   */
  public constructor(
    protected readonly hash: Nullable<SupportedHash>,
    protected readonly algorithm: string
  ) {}

  /**
   * Name of the JSON Web Signature Algorithm.
   */
  public get alg(): string {
    return this.algorithm
  }

  /**
   * Signs a message with the given key.
   *
   * @param message Message to be signed.
   * @param key JWK used to sign the message.
   * @returns Base64Url string representation of the signed message.
   */
  public abstract sign(message: Buffer, key?: JsonWebKey): Promise<string>

  /**
   * Matches a signature against a message with the given key.
   *
   * @param signature Signature to be matched against the message.
   * @param message Message to be matched against the signature.
   * @param key Key used to verify the signature.
   * @throws {InvalidSignature} The signature does not match the message.
   */
  public abstract verify(
    signature: string,
    message: Buffer,
    key?: JsonWebKey
  ): Promise<void>

  /**
   * Checks if a key can be used by the requesting algorithm.
   *
   * @param key Key to be checked.
   * @throws {InvalidKey} The provided JSON Web Key is invalid.
   */
  protected checkKey(key: JsonWebKey): void {
    if (!(key instanceof JsonWebKey)) {
      throw new InvalidKey()
    }

    if (key.alg && key.alg !== this.algorithm) {
      throw new InvalidKey(
        `This key is intended to be used by the algorithm "${key.alg}".`
      )
    }

    if (key.kty !== this.kty) {
      throw new InvalidKey(`This algorithm only accepts "${this.kty}" keys.`)
    }
  }
}
