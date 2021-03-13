import { sign, verify } from 'crypto'

import { Base64Url } from '@guarani/utils'

import { InvalidKey, InvalidSignature } from '../../exceptions'
import { JsonWebKey } from '../../jwk'
import { ECParams, SupportedCurves } from '../jwk'

import {
  checkKey as baseCheckKey,
  JWSAlgorithm,
  SupportedHashes
} from './algorithm'

/**
 * Checks if a key can be used by the requesting Elliptic Curve algorithm.
 *
 * @param key - Key to be checked.
 * @param alg - Algorithm requesting the usage of the key.
 * @param kty - Type of the key.
 * @param curve - Curve of the algorithm.
 */
function checkKey(
  key: JsonWebKey,
  alg: string,
  kty: string,
  curve: SupportedCurves
): void {
  baseCheckKey(key, alg, kty)

  // @ts-expect-error
  if (key.crv !== curve)
    throw new InvalidKey(`This algorithm only accepts the curve "${curve}".`)
}

/**
 * Implementation of an ECDSA Signature Algorithm.
 */
class Algorithm extends JWSAlgorithm {
  /**
   * Accepted key type.
   */
  private keyType = 'EC'

  /**
   * Instantiates a new ECDSA Algorithm to sign and verify the messages.
   *
   * @param hash - Hash algorithm used to sign and verify the messages.
   * @param algorithm - Name of the algorithm.
   * @param curve - Curve to be used by the algorithm.
   */
  public constructor(
    protected hash: SupportedHashes,
    protected algorithm: string,
    protected curve: SupportedCurves
  ) {
    super(hash, algorithm)
  }

  /**
   * Signs the provided message using ECDSA.
   *
   * @param data - Data to be signed.
   * @param key - Key used to sign the message.
   * @returns Base64Url encoded signature.
   */
  public sign(data: Buffer, key: JsonWebKey<ECParams>): string {
    checkKey(key, this.algorithm, this.keyType, this.curve)

    return Base64Url.encode(sign(this.hash, data, key.privateKey))
  }

  /**
   * Verifies the signature against a message using ECDSA.
   *
   * @param signature - Signature to be matched against the message.
   * @param data - Message to be matched against the signature.
   * @param key - Key used to verify the signature.
   */
  public verify(
    signature: string,
    data: Buffer,
    key: JsonWebKey<ECParams>
  ): void {
    checkKey(key, this.algorithm, this.keyType, this.curve)

    if (!verify(this.hash, data, key.publicKey, Base64Url.decode(signature)))
      throw new InvalidSignature()
  }
}

/**
 * Instantiates an ECDSA with SHA256.
 *
 * @returns ECDSA using SHA256.
 */
export function ES256(): Algorithm {
  return new Algorithm('sha256', 'ES256', 'P-256')
}

/**
 * Instantiates an ECDSA with SHA384.
 *
 * @returns ECDSA using SHA384.
 */
export function ES384(): Algorithm {
  return new Algorithm('sha384', 'ES384', 'P-384')
}

/**
 * Instantiates an ECDSA with SHA512.
 *
 * @returns ECDSA using SHA512.
 */
export function ES512(): Algorithm {
  return new Algorithm('sha512', 'ES512', 'P-521')
}
