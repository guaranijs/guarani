import type { JsonWebKey, SupportedJWKAlgorithm } from '../../jwk'
import { JWSAlgorithm } from './jws-algorithm'

/**
 * Implementation of the `none` algorithm.
 *
 * This algorithm provides an empty string as a signature,
 * and the verification of a signature always succeeds.
 *
 * It is **NOT RECOMMENDED** to use this algorithm in production.
 */
class NoneAlgorithm extends JWSAlgorithm {
  public readonly kty: SupportedJWKAlgorithm = null

  public constructor() {
    super(null, 'none')
  }

  /**
   * Returns an empty string as a signature.
   *
   * @param message Message to be signed.
   * @param key Key used to sign the message.
   * @returns Empty string.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async sign(message: Buffer, key?: JsonWebKey): Promise<string> {
    return ''
  }

  /**
   * Always successfully verifies the signature.
   *
   * @param signature Signature to be matched against the message.
   * @param message Message to be matched against the signature.
   * @param key Key used to verify the signature.
   */
  public async verify(
    signature: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    message: Buffer, // eslint-disable-line @typescript-eslint/no-unused-vars
    key?: JsonWebKey // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<void> {}
}

/**
 * `none` algorithm.
 */
export const none = new NoneAlgorithm()
