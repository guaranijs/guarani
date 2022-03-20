/* eslint-disable @typescript-eslint/no-unused-vars */
import { Optional } from '@guarani/types';

import { SupportedJsonWebKeyAlgorithm } from '../../jwk/algorithms/supported-jsonwebkey-algorithm';
import { JsonWebKey } from '../../jwk/jsonwebkey';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature.algorithm';

class NoneAlgorithm extends JsonWebSignatureAlgorithm {
  /**
   * Denotes the type of JSON Web Key supported by this JSON Web Signature Algorithm.
   */
  protected readonly keyType?: Optional<SupportedJsonWebKeyAlgorithm>;

  /**
   * Instantiates a new JSON Web Signature `none` Algorithm.
   */
  public constructor() {
    super(null, 'none');
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public async sign(message: Buffer, key?: Optional<JsonWebKey>): Promise<Buffer> {
    return Buffer.alloc(0);
  }

  /**
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public async verify(signature: Buffer, message: Buffer, key?: Optional<JsonWebKey>): Promise<void> {}
}

/**
 * JSON Web Signature **none** Algorithm.
 */
export const none = new NoneAlgorithm();
