import { Dict } from '@guarani/types';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-json-web-encryption.exception';
import { OctKey } from '../../../jwk/algorithms/oct/oct.key';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../enc/jsonwebencryption-contentencryption.algorithm';
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
    super('dir', 'oct');
  }

  /**
   * Returns an empty Buffer since the Algorithm does not Wrap the provided Content Encryption Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key to be used as the Content Encryption Key used to Encrypt the Plaintext.
   * @returns Empty Buffer as the Wrapped Content Encryption Key.
   */
  public async wrap(enc: JsonWebEncryptionContentEncryptionAlgorithm, key: OctKey): Promise<WrappedKey<Dict>> {
    this.validateJsonWebKey(key);

    const cek = key.export({ encoding: 'buffer' });
    const ek = Buffer.alloc(0);

    enc.validateContentEncryptionKey(cek);

    return { cek, ek };
  }

  /**
   * Returns the provided JSON Web Key as the Content Encryption Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key used as the Content Encryption Key.
   * @param ek ~Wrapped Content Encryption Key~.
   * @returns Provided JSON Web Key as the Content Encryption Key.
   */
  public async unwrap(enc: JsonWebEncryptionContentEncryptionAlgorithm, key: OctKey, ek: Buffer): Promise<Buffer> {
    if (ek.length !== 0) {
      throw new InvalidJsonWebEncryptionException('Expected the Encrypted Content Encryption Key to be empty.');
    }

    const cek = key.export({ encoding: 'buffer' });

    enc.validateContentEncryptionKey(cek);

    return cek;
  }
}

/**
 * Direct Encryption with a Shared Symmetric Key.
 */
export const dir = new DirKeyWrapAlgorithm();
