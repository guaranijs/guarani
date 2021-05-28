import { Base64Url } from '@guarani/utils'

import { createHmac } from 'crypto'

import { InvalidKey, InvalidSignature } from '../../exceptions'
import { OCTSecretKey } from '../../jwk'
import { checkKey as baseCheckKey, JWSAlgorithm, SupportedHashes } from './base'

/**
 * Checks if a key can be used by the requesting HMAC Algorithm.
 *
 * @param key - Key to be checked.
 * @param alg - Algorithm requesting the usage of the key.
 * @param kty - Type of the key.
 * @param keySize - Size of the secret in bytes.
 * @throws {InvalidKey} The provided JSON Web Key is invalid.
 */
function checkKey(
  key: OCTSecretKey,
  alg: string,
  kty: string,
  keySize: number
): void {
  baseCheckKey(key, alg, kty)

  if (Base64Url.bufferLength(key.k) < keySize)
    throw new InvalidKey(`The secret MUST be AT LEAST ${keySize} bytes.`)
}

/**
 * Implementation of an HMAC Signature Algorithm.
 */
class HMACAlgorithm extends JWSAlgorithm {
  /**
   * Accepted key type.
   */
  private readonly keyType = 'oct'

  /**
   * Instantiates a new HMAC Algorithm to sign and verify the messages.
   *
   * @param hash - Hash algorithm used to sign and verify the messages.
   * @param algorithm - Name of the algorithm.
   * @param keySize - Minimum buffer size in bytes of the secret
   * accepted by the algorithm.
   */
  public constructor(
    protected readonly hash: SupportedHashes,
    protected readonly algorithm: string,
    protected readonly keySize: number
  ) {
    super(hash, algorithm)
  }

  /**
   * Signs the provided message using HMAC.
   *
   * @param message - Message to be signed.
   * @param key - Key used to sign the message.
   * @returns Base64Url encoded signature.
   */
  public sign(message: Buffer, key: OCTSecretKey): string {
    checkKey(key, this.algorithm, this.keyType, this.keySize)

    const signature = createHmac(this.hash, key.secretKey)

    signature.update(message)

    return Base64Url.encode(signature.digest())
  }

  /**
   * Verifies the signature against a message using HMAC.
   *
   * @param signature - Signature to be matched against the message.
   * @param message - Message to be matched against the signature.
   * @param key - Key used to verify the signature.
   * @throws {InvalidSignature} The signature does not match the message.
   */
  public verify(signature: string, message: Buffer, key: OCTSecretKey): void {
    checkKey(key, this.algorithm, this.keyType, this.keySize)

    if (this.sign(message, key) !== signature) throw new InvalidSignature()
  }
}

/**
 * Instantiates an HMAC with SHA256.
 *
 * @returns HMAC using SHA256.
 */
export function HS256(): HMACAlgorithm {
  return new HMACAlgorithm('sha256', 'HS256', 32)
}

/**
 * Instantiates an HMAC with SHA384.
 *
 * @returns HMAC using SHA384.
 */
export function HS384(): HMACAlgorithm {
  return new HMACAlgorithm('sha384', 'HS384', 48)
}

/**
 * Instantiates an HMAC with SHA512.
 *
 * @returns HMAC using SHA512.
 */
export function HS512(): HMACAlgorithm {
  return new HMACAlgorithm('sha512', 'HS512', 64)
}
