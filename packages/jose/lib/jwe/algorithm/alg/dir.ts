/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dict, Optional } from '@guarani/types';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-json-web-encryption.exception';
import { JoseException } from '../../../exceptions/jose.exception';
import { OctKey } from '../../../jwk/algorithms/oct/oct.key';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap.algorithm';
import { WrappedKey } from './wrapped-key';

/**
 * Implementation of the dir JSON Web Encryption Key Wrap Algorithm.
 */
class DirKeyWrapAlgorithm extends JsonWebEncryptionKeyWrapAlgorithm {
  /**
   * Returns an empty Buffer since the Algorithm does not Wrap the provided Content Encryption Key.
   *
   * @param cek Content Encryption Key used to Encrypt the Plaintext.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @returns Empty Buffer as the Wrapped Content Encryption Key.
   */
  public async wrap(cek: Buffer, key?: Optional<OctKey>): Promise<WrappedKey<Dict>> {
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
    try {
      return key.export({ encoding: 'buffer' });
    } catch (exc: any) {
      if (exc instanceof JoseException) {
        throw new InvalidJsonWebEncryptionException(exc);
      }

      throw new InvalidJsonWebEncryptionException();
    }
  }
}

/**
 * Direct Encryption with a Shared Symmetric Key.
 */
export const dir = new DirKeyWrapAlgorithm('dir');
