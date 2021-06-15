import { Base64Url } from '@guarani/utils'

import { createPrivateKey, createPublicKey, sign, verify } from 'crypto'

import { InvalidKey, InvalidSignature } from '../../exceptions'
import { EcKey, SupportedEllipticCurve, SupportedJWKAlgorithm } from '../../jwk'
import { SupportedHash } from '../../types'
import { JWSAlgorithm } from './jws-algorithm'

/**
 * Implementation of an ECDSA Signature Algorithm.
 */
class ECDSAAlgorithm extends JWSAlgorithm {
  /**
   * Accepted key type.
   */
  public readonly kty: SupportedJWKAlgorithm = 'EC'

  /**
   * Instantiates a new ECDSA Algorithm to sign and verify the messages.
   *
   * @param hash - Hash algorithm used to sign and verify the messages.
   * @param algorithm - Name of the algorithm.
   * @param curve - Curve to be used by the algorithm.
   */
  public constructor(
    protected readonly hash: SupportedHash,
    protected readonly algorithm: string,
    protected readonly curve: SupportedEllipticCurve
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
  public async sign(message: Buffer, key: EcKey): Promise<string> {
    this.checkKey(key)

    const privateKey = createPrivateKey(key.export('private', 'pem', 'sec1'))

    return Base64Url.encode(sign(this.hash, message, privateKey))
  }

  /**
   * Verifies the signature against a message using ECDSA.
   *
   * @param signature - Signature to be matched against the message.
   * @param message - Message to be matched against the signature.
   * @param key - Key used to verify the signature.
   * @throws {InvalidSignature} The signature does not match the message.
   */
  public async verify(
    signature: string,
    message: Buffer,
    key: EcKey
  ): Promise<void> {
    this.checkKey(key)

    const publicKey = createPublicKey(key.export('public', 'pem'))

    if (!verify(this.hash, message, publicKey, Base64Url.decode(signature))) {
      throw new InvalidSignature()
    }
  }

  /**
   * Checks if a key can be used by the requesting algorithm.
   *
   * @param key - Key to be checked.
   * @throws {InvalidKey} The provided JSON Web Key is invalid.
   */
  protected checkKey(key: EcKey): void {
    super.checkKey(key)

    if (key.crv !== this.curve) {
      throw new InvalidKey(
        `This algorithm only accepts the curve "${this.curve}".`
      )
    }
  }
}

/**
 * ECDSA with SHA256.
 */
export const ES256 = new ECDSAAlgorithm('SHA256', 'ES256', 'P-256')

/**
 * ECDSA with SHA384.
 */
export const ES384 = new ECDSAAlgorithm('SHA384', 'ES384', 'P-384')

/**
 * ECDSA with SHA512.
 */
export const ES512 = new ECDSAAlgorithm('SHA512', 'ES512', 'P-521')
