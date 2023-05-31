import { Buffer } from 'buffer';

import { JsonWebSignatureBackend } from './jsonwebsignature.backend';

/**
 * Implementation of the JSON Web Signature none Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-3.6
 */
class NoneBackend extends JsonWebSignatureBackend {
  /**
   * Instantiates a new JSON Web Signature none Backend to Sign and Verify Messages.
   */
  public constructor() {
    super('none');
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key ~JSON Web Key used to Sign the provided Message.~
   * @returns Resulting Signature of the provided Message.
   */
  // @ts-expect-error Unused parameter.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async sign(message: Buffer, key: null): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key ~JSON Web Key used to verify the Signature and Message.~
   */
  // @ts-expect-error Unused parameter.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  public async verify(signature: Buffer, message: Buffer, key: null): Promise<void> {}
}

/**
 * No digital signature or MAC performed.
 */
export const none = new NoneBackend();
