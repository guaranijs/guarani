import { InvalidKey } from '../../exceptions'
import { JsonWebKey } from '../../jwk'

export type SupportedHashes = 'sha256' | 'sha384' | 'sha512'

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
   * Instantiates a new JWS Algorithm to sign and verify the messages.
   *
   * @param hash - Hash algorithm used to sign and verify the messages.
   * @param algorithm - Name of the algorithm.
   */
  public constructor(
    protected hash: SupportedHashes,
    protected algorithm: string
  ) {}

  /**
   * Signs a message with the given key.
   *
   * @param message - Message to be signed.
   * @param key - JWK used to sign the message.
   * @returns Base64Url string representation of the signed message.
   */
  public abstract sign(message: Buffer, key: JsonWebKey): string

  /**
   * Matches a signature against a message with the given key.
   *
   * @param signature - Signature to be matched against the message.
   * @param message - Message to be matched against the signature.
   * @param key - Key used to verify the signature.
   */
  public abstract verify(
    signature: string,
    message: Buffer,
    key: JsonWebKey
  ): void
}

/**
 * Checks if a key can be used by the requesting algorithm.
 *
 * @param key - Key to be checked.
 * @param alg - Algorithm requesting the usage of the key.
 * @param kty - Type of the key.
 */
export function checkKey(key: JsonWebKey, alg: string, kty: string): void {
  if (!(key instanceof JsonWebKey)) throw new InvalidKey()

  if (key.alg && key.alg !== alg)
    throw new InvalidKey(
      `This key is intended to be used by the algorithm "${key.alg}".`
    )

  if (key.kty !== kty)
    throw new InvalidKey(`This algorithm only accepts "${kty}" keys.`)
}
