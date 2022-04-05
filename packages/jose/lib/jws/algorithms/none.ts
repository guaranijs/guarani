/* eslint-disable @typescript-eslint/no-unused-vars */
import { JsonWebSignatureAlgorithm } from './jsonwebsignature.algorithm';

/**
 * Implementation of the JSON Web Signature none Algorithm.
 */
class NoneAlgorithm extends JsonWebSignatureAlgorithm {
  /**
   * Instantiates a new JSON Web Signature none Algorithm to Sign and Verify the Messages.
   */
  public constructor() {
    super(null, 'none');
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   */
  public async verify(signature: Buffer, message: Buffer): Promise<void> {}
}

/**
 * No digital signature or MAC performed.
 */
export const none = new NoneAlgorithm();
