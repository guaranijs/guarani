import { Base64Url } from '@guarani/utils'

import { sign, verify, constants } from 'crypto'

import { InvalidSignature } from '../../exceptions'
import { RSAPrivateKey, RSAPublicKey } from '../../jwk'
import { checkKey, JWSAlgorithm, SupportedHashes } from './base'

/**
 * Implementation of an RSASSA Signature Algorithm.
 */
class RSASSAAlgorithm extends JWSAlgorithm {
  /**
   * Accepted key type.
   */
  private keyType = 'RSA'

  /**
   * Instantiates a new RSASSA Algorithm to sign and verify the messages.
   *
   * @param hash - Hash algorithm used to sign and verify the messages.
   * @param algorithm - Name of the algorithm.
   * @param padding - Padding to be used by the algorithm.
   */
  public constructor(
    protected hash: SupportedHashes,
    protected algorithm: string,
    protected padding: number
  ) {
    super(hash, algorithm)
  }

  /**
   * Signs the provided message using RSASSA.
   *
   * @param message - Message to be signed.
   * @param key - Key used to sign the message.
   * @returns Base64Url encoded signature.
   */
  public sign(message: Buffer, key: RSAPrivateKey): string {
    checkKey(key, this.algorithm, this.keyType)

    return Base64Url.encode(
      sign(this.hash, message, { key: key.privateKey, padding: this.padding })
    )
  }

  /**
   * Verifies the signature against a message using RSASSA.
   *
   * @param signature - Signature to be matched against the message.
   * @param message - Message to be matched against the signature.
   * @param key - Key used to verify the signature.
   * @throws {InvalidSignature} The signature does not match the message.
   */
  public verify(signature: string, message: Buffer, key: RSAPublicKey): void {
    checkKey(key, this.algorithm, this.keyType)

    const verified = verify(
      this.hash,
      message,
      { key: key.publicKey, padding: this.padding },
      Base64Url.decode(signature)
    )

    if (!verified) throw new InvalidSignature()
  }
}

/**
 * Instantiates an RSASSA-PKCS1-v1_5 with SHA256.
 *
 * @returns RSASSA-PKCS1-v1_5 using SHA256.
 */
export function RS256(): RSASSAAlgorithm {
  return new RSASSAAlgorithm('sha256', 'RS256', constants.RSA_PKCS1_PADDING)
}

/**
 * Instantiates an RSASSA-PKCS1-v1_5 with SHA384.
 *
 * @returns RSASSA-PKCS1-v1_5 using SHA384.
 */
export function RS384(): RSASSAAlgorithm {
  return new RSASSAAlgorithm('sha384', 'RS384', constants.RSA_PKCS1_PADDING)
}

/**
 * Instantiates an RSASSA-PKCS1-v1_5 with SHA512.
 *
 * @returns RSASSA-PKCS1-v1_5 using SHA512.
 */
export function RS512(): RSASSAAlgorithm {
  return new RSASSAAlgorithm('sha512', 'RS512', constants.RSA_PKCS1_PADDING)
}

/**
 * Instantiates an RSASSA-PSS with SHA256.
 *
 * @returns RSASSA-PSS using SHA256.
 */
export function PS256(): RSASSAAlgorithm {
  return new RSASSAAlgorithm('sha256', 'PS256', constants.RSA_PKCS1_PSS_PADDING)
}

/**
 * Instantiates an RSASSA-PSS with SHA384.
 *
 * @returns RSASSA-PSS using SHA384.
 */
export function PS384(): RSASSAAlgorithm {
  return new RSASSAAlgorithm('sha384', 'PS384', constants.RSA_PKCS1_PSS_PADDING)
}

/**
 * Instantiates an RSASSA-PSS with SHA512.
 *
 * @returns RSASSA-PSS using SHA512.
 */
export function PS512(): RSASSAAlgorithm {
  return new RSASSAAlgorithm('sha512', 'PS512', constants.RSA_PKCS1_PSS_PADDING)
}
