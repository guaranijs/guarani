import { Buffer } from 'buffer';

import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.enum';
import { JsonWebSignatureBackend } from './jsonwebsignature.backend';

/**
 * Implementation of the JSON Web Signature **none** Backend.
 */
class NoneBackend extends JsonWebSignatureBackend {
  /**
   * Instantiates a new JSON Web Signature **none** Backend to Sign and Verify Messages.
   */
  public constructor() {
    super(JsonWebSignatureAlgorithm.None);
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @returns Resulting Signature of the provided Message.
   */
  // @ts-expect-error Unused parameter.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async sign(message: Buffer): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   */
  // @ts-expect-error Unused parameter.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  public async verify(signature: Buffer, message: Buffer): Promise<void> {}
}

/**
 * No digital signature or MAC performed.
 */
export const none = new NoneBackend();
