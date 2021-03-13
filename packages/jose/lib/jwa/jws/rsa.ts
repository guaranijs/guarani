import { sign, verify, constants } from 'crypto'

import { Base64Url } from '@guarani/utils'

import { InvalidSignature } from '../../exceptions'
import { JsonWebKey } from '../../jwk'
import { RSAParams } from '../jwk'
import { checkKey, JWSAlgorithm, SupportedHashes } from './algorithm'

/**
 * Implementation of an RSA Signature Algorithm.
 */
class Algorithm extends JWSAlgorithm {
  /**
   * Accepted key type.
   */
  private keyType = 'RSA'

  /**
   * Instantiates a new RSA Algorithm to sign and verify the messages.
   *
   * @param hash - Hash algorithm used to sign and verify the messages.
   * @param algorithm - Name of the algorithm.
   * @param padding - Padding to be used by the algorithm.
   */
  public constructor(
    protected hash: SupportedHashes,
    protected algorithm: string,
    private padding: number
  ) {
    super(hash, algorithm)
  }

  /**
   * Signs the provided message using RSA.
   *
   * @param data - Data to be signed.
   * @param key - Key used to sign the message.
   * @returns Base64Url encoded signature.
   */
  public sign(data: Buffer, key: JsonWebKey<RSAParams>): string {
    checkKey(key, this.algorithm, this.keyType)

    return Base64Url.encode(
      sign(this.hash, data, { key: key.privateKey, padding: this.padding })
    )
  }

  /**
   * Verifies the signature against a message using RSA.
   *
   * @param signature - Signature to be matched against the message.
   * @param data - Message to be matched against the signature.
   * @param key - Key used to verify the signature.
   */
  public verify(
    signature: string,
    data: Buffer,
    key: JsonWebKey<RSAParams>
  ): void {
    checkKey(key, this.algorithm, this.keyType)

    const verified = verify(
      this.hash,
      data,
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
export function RS256(): Algorithm {
  return new Algorithm('sha256', 'RS256', constants.RSA_PKCS1_PADDING)
}

/**
 * Instantiates an RSASSA-PKCS1-v1_5 with SHA384.
 *
 * @returns RSASSA-PKCS1-v1_5 using SHA384.
 */
export function RS384(): Algorithm {
  return new Algorithm('sha384', 'RS384', constants.RSA_PKCS1_PADDING)
}

/**
 * Instantiates an RSASSA-PKCS1-v1_5 with SHA512.
 *
 * @returns RSASSA-PKCS1-v1_5 using SHA512.
 */
export function RS512(): Algorithm {
  return new Algorithm('sha512', 'RS512', constants.RSA_PKCS1_PADDING)
}

/**
 * Instantiates an RSASSA-PSS with SHA256.
 *
 * @returns RSASSA-PSS using SHA256.
 */
export function PS256(): Algorithm {
  return new Algorithm('sha256', 'PS256', constants.RSA_PKCS1_PSS_PADDING)
}

/**
 * Instantiates an RSASSA-PSS with SHA384.
 *
 * @returns RSASSA-PSS using SHA384.
 */
export function PS384(): Algorithm {
  return new Algorithm('sha384', 'PS384', constants.RSA_PKCS1_PSS_PADDING)
}

/**
 * Instantiates an RSASSA-PSS with SHA512.
 *
 * @returns RSASSA-PSS using SHA512.
 */
export function PS512(): Algorithm {
  return new Algorithm('sha512', 'PS512', constants.RSA_PKCS1_PSS_PADDING)
}
