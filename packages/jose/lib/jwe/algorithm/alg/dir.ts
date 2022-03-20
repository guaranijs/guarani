/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dict } from '@guarani/types';

import { OctKey } from '../../../jwk/algorithms/oct/oct.key';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap.algorithm';
import { WrappedKey } from './types/wrapped-key';

/**
 * Implementation of the dir JSON Web Encryption Key Wrap Algorithm.
 */
class DirKeyWrapAlgorithm extends JsonWebEncryptionKeyWrapAlgorithm {
  /**
   * Instantiates a new JSON Web Encryption dir Key Wrap Algorithm to Wrap and Unwrap Content Encryption Keys.
   */
  public constructor() {
    super('dir');
  }

  /**
   * Returns an empty Buffer since the Algorithm does not Wrap the provided Content Encryption Key.
   *
   * @param key JSON Web Key to be used as the Content Encryption Key used to Encrypt the Plaintext.
   * @returns Empty Buffer as the Wrapped Content Encryption Key.
   */
  public async wrap(cek: Buffer, key: OctKey): Promise<WrappedKey<Dict>> {
    this.validateJsonWebKey(key);

    return { ek: Buffer.alloc(0) };
  }

  /**
   * Returns the provided JSON Web Key as the Content Encryption Key.
   *
   * @param ek ~Ignored Parameter~.
   * @param key JSON Web Key used as the Content Encryption Key.
   * @returns Provided JSON Web Key as the Content Encryption Key.
   */
  public async unwrap(ek: Buffer, key: OctKey): Promise<Buffer> {
    return key.export({ encoding: 'buffer' });
  }
}

/**
 * Direct Encryption with a Shared Symmetric Key.
 */
export const dir = new DirKeyWrapAlgorithm();
