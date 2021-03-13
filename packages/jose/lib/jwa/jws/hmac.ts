import { createHmac } from 'crypto'

import { Base64Url } from '@guarani/utils'

import { InvalidSignature } from '../../exceptions'
import { JsonWebKey } from '../../jwk'
import { checkKey, JWSAlgorithm } from './algorithm'

/**
 * Implementation of an HMAC Signature Algorithm.
 */
class Algorithm extends JWSAlgorithm {
  /**
   * Accepted key type.
   */
  private keyType = 'oct'

  /**
   * Signs the provided message using HMAC.
   *
   * @param data - Data to be signed.
   * @param key - Key used to sign the message.
   * @returns Base64Url encoded signature.
   */
  public sign(data: Buffer, key: JsonWebKey): string {
    checkKey(key, this.algorithm, this.keyType)

    const signature = createHmac(this.hash, key.secretKey)

    signature.update(data)

    return Base64Url.encode(signature.digest())
  }

  /**
   * Verifies the signature against a message using HMAC.
   *
   * @param signature - Signature to be matched against the message.
   * @param data - Message to be matched against the signature.
   * @param key - Key used to verify the signature.
   */
  public verify(signature: string, data: Buffer, key: JsonWebKey): void {
    checkKey(key, this.algorithm, this.keyType)

    if (this.sign(data, key) !== signature) throw new InvalidSignature()
  }
}

/**
 * Instantiates an HMAC with SHA256.
 *
 * @returns HMAC using SHA256.
 */
export function HS256(): Algorithm {
  return new Algorithm('sha256', 'HS256')
}

/**
 * Instantiates an HMAC with SHA384.
 *
 * @returns HMAC using SHA384.
 */
export function HS384(): Algorithm {
  return new Algorithm('sha384', 'HS384')
}

/**
 * Instantiates an HMAC with SHA512.
 *
 * @returns HMAC using SHA512.
 */
export function HS512(): Algorithm {
  return new Algorithm('sha512', 'HS512')
}
