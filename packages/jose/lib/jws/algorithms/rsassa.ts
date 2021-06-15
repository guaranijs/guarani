import { Base64Url } from '@guarani/utils'

import { createPrivateKey, createPublicKey, sign, verify } from 'crypto'

import { InvalidSignature } from '../../exceptions'
import { RsaKey, RsaPadding, SupportedJWKAlgorithm } from '../../jwk'
import { SupportedHash } from '../../types'
import { JWSAlgorithm } from './jws-algorithm'

/**
 * Implementation of an RSASSA Signature Algorithm.
 */
class RSASSAAlgorithm extends JWSAlgorithm {
  /**
   * Accepted key type.
   */
  public readonly kty: SupportedJWKAlgorithm = 'RSA'

  /**
   * Instantiates a new RSASSA Algorithm to sign and verify the messages.
   *
   * @param hash - Hash algorithm used to sign and verify the messages.
   * @param algorithm - Name of the algorithm.
   * @param padding - Padding to be used by the algorithm.
   */
  public constructor(
    protected readonly hash: SupportedHash,
    protected readonly algorithm: string,
    protected readonly padding: RsaPadding
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
  public async sign(message: Buffer, key: RsaKey): Promise<string> {
    this.checkKey(key)

    const privateKey = createPrivateKey(key.export('private', 'pem', 'pkcs1'))

    return Base64Url.encode(
      sign(this.hash, message, { key: privateKey, padding: this.padding })
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
  public async verify(
    signature: string,
    message: Buffer,
    key: RsaKey
  ): Promise<void> {
    this.checkKey(key)

    const publicKey = createPublicKey(key.export('public', 'pem', 'pkcs1'))
    const verified = verify(
      this.hash,
      message,
      { key: publicKey, padding: this.padding },
      Base64Url.decode(signature)
    )

    if (!verified) {
      throw new InvalidSignature()
    }
  }
}

/**
 * RSASSA-PKCS1-v1_5 with SHA256.
 */
export const RS256 = new RSASSAAlgorithm('SHA256', 'RS256', RsaPadding.PKCS1)

/**
 * RSASSA-PKCS1-v1_5 with SHA384.
 */
export const RS384 = new RSASSAAlgorithm('SHA384', 'RS384', RsaPadding.PKCS1)

/**
 * RSASSA-PKCS1-v1_5 with SHA512.
 */
export const RS512 = new RSASSAAlgorithm('SHA512', 'RS512', RsaPadding.PKCS1)

/**
 * RSASSA-PSS with SHA256.
 */
export const PS256 = new RSASSAAlgorithm('SHA256', 'PS256', RsaPadding.PSS)

/**
 * RSASSA-PSS with SHA384.
 */
export const PS384 = new RSASSAAlgorithm('SHA384', 'PS384', RsaPadding.PSS)

/**
 * RSASSA-PSS with SHA512.
 */
export const PS512 = new RSASSAAlgorithm('SHA512', 'PS512', RsaPadding.PSS)
