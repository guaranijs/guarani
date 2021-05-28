import { Base64Url } from '@guarani/utils'

import { sign, verify } from 'crypto'

import { InvalidKey, InvalidSignature } from '../../exceptions'
import {
  ECPrivateKey,
  ECPublicKey,
  JsonWebKey,
  SupportedCurves
} from '../../jwk'

import { checkKey as baseCheckKey, JWSAlgorithm, SupportedHashes } from './base'

/**
 * Checks if a key can be used by the requesting ECDSA Algorithm.
 *
 * @param key - Key to be checked.
 * @param alg - Algorithm requesting the usage of the key.
 * @param kty - Type of the key.
 * @param curve - Curve of the algorithm.
 * @throws {InvalidKey} The provided JSON Web Key is invalid.
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
class ECDSAAlgorithm extends JWSAlgorithm {
  /**
   * Accepted key type.
   */
  private readonly keyType = 'EC'

  /**
   * Instantiates a new ECDSA Algorithm to sign and verify the messages.
   *
   * @param hash - Hash algorithm used to sign and verify the messages.
   * @param algorithm - Name of the algorithm.
   * @param curve - Curve to be used by the algorithm.
   */
  public constructor(
    protected readonly hash: SupportedHashes,
    protected readonly algorithm: string,
    protected readonly curve: SupportedCurves
  ) {
    super(hash, algorithm)
  }

  /**
   * Signs the provided message using ECDSA.
   *
   * @param message - Message to be signed.
   * @param key - Key used to sign the message.
   * @returns Base64Url encoded signature.
   */
  public sign(message: Buffer, key: ECPrivateKey): string {
    checkKey(key, this.algorithm, this.keyType, this.curve)

    return Base64Url.encode(sign(this.hash, message, key.privateKey))
  }

  /**
   * Verifies the signature against a message using ECDSA.
   *
   * @param signature - Signature to be matched against the message.
   * @param message - Message to be matched against the signature.
   * @param key - Key used to verify the signature.
   * @throws {InvalidSignature} The signature does not match the message.
   */
  public verify(signature: string, message: Buffer, key: ECPublicKey): void {
    checkKey(key, this.algorithm, this.keyType, this.curve)

    if (!verify(this.hash, message, key.publicKey, Base64Url.decode(signature)))
      throw new InvalidSignature()
  }
}

/**
 * Instantiates an ECDSA with SHA256.
 *
 * @returns ECDSA using SHA256.
 */
export function ES256(): ECDSAAlgorithm {
  return new ECDSAAlgorithm('sha256', 'ES256', 'P-256')
}

/**
 * Instantiates an ECDSA with SHA384.
 *
 * @returns ECDSA using SHA384.
 */
export function ES384(): ECDSAAlgorithm {
  return new ECDSAAlgorithm('sha384', 'ES384', 'P-384')
}

/**
 * Instantiates an ECDSA with SHA512.
 *
 * @returns ECDSA using SHA512.
 */
export function ES512(): ECDSAAlgorithm {
  return new ECDSAAlgorithm('sha512', 'ES512', 'P-521')
}
