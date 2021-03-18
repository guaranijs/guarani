import type { JsonWebKey } from '../../jwk'
import { JWSAlgorithm } from './base'

/**
 * Implementation of the `none` algorithm.
 *
 * This algorithm provides an empty string as a signature,
 * and the verification of a signature always succeeds.
 *
 * It is **NOT RECOMMENDED** to use this algorithm in production.
 */
class NoneAlgorithm extends JWSAlgorithm {
  public constructor() {
    super(undefined, 'none')
  }

  /**
   * Returns an empty string as a signature.
   *
   * @param message - Message to be signed.
   * @param key - Key used to sign the message.
   * @returns Empty string.
   */
  public sign(message: Buffer, key?: JsonWebKey): string {
    return ''
  }

  /**
   * Always successfully verifies the signature.
   *
   * @param signature - Signature to be matched against the message.
   * @param message - Message to be matched against the signature.
   * @param key - Key used to verify the signature.
   */
  public verify(signature: string, message: Buffer, key?: JsonWebKey): void {}
}

/**
 * Instantiates a `none` algorithm.
 *
 * @returns Instance of the `none` algorithm.
 */
export function none(): NoneAlgorithm {
  return new NoneAlgorithm()
}
