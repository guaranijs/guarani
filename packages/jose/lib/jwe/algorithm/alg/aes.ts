import { Dict } from '@guarani/types';

import { createCipheriv, createDecipheriv, KeyObject } from 'crypto';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-json-web-encryption.exception';
import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { JoseException } from '../../../exceptions/jose.exception';
import { OctKey } from '../../../jwk/algorithms/oct/oct.key';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from '../../supported-jsonwebencryption-keyencryption-algorithm';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap.algorithm';
import { WrappedKey } from './wrapped-key';

/**
 * Implementation of the AES JSON Web Encryption Key Wrap Algorithm.
 */
export class AesKeyWrapAlgorithm extends JsonWebEncryptionKeyWrapAlgorithm {
  /**
   * Size of the Content Encryption Key in bits.
   */
  private readonly keySize: number;

  /**
   * Name of the Cipher Algorithm.
   */
  private readonly cipherAlgorithm: string;

  /**
   * Instantiates a new JSON Web Encryption Key Wrap Algorithm to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Algorithm.
   */
  public constructor(algorithm: SupportedJsonWebEncryptionKeyWrapAlgorithm) {
    super(algorithm);

    this.keySize = Number.parseInt(this.algorithm.substring(1, 4));
    this.cipherAlgorithm = `aes${this.keySize}-wrap`;
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param cek Content Encryption Key used to Encrypt the Plaintext.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @returns Wrapped Content Encryption Key and optional additional JSON Web Encryption Header Parameters.
   */
  public async wrap(cek: Buffer, key: OctKey): Promise<WrappedKey<Dict>> {
    const exportedKey = key.export({ encoding: 'buffer' });

    if (exportedKey.length * 8 !== this.keySize) {
      throw new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.');
    }

    const cryptoKey = <KeyObject>Reflect.get(key, 'cryptoKey');
    const cipher = createCipheriv(this.cipherAlgorithm, cryptoKey, Buffer.alloc(8, 0xa6));

    const wrappedKey = Buffer.concat([cipher.update(cek), cipher.final()]);

    return { ek: wrappedKey };
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param ek Wrapped Content Encryption Key.
   * @param key JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(ek: Buffer, key: OctKey): Promise<Buffer> {
    try {
      const exportedKey = key.export({ encoding: 'buffer' });

      if (exportedKey.length * 8 !== this.keySize) {
        throw new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.');
      }

      const cryptoKey = <KeyObject>Reflect.get(key, 'cryptoKey');
      const decipher = createDecipheriv(this.cipherAlgorithm, cryptoKey, Buffer.alloc(8, 0xa6));

      return Buffer.concat([decipher.update(ek), decipher.final()]);
    } catch (exc) {
      if (exc instanceof JoseException) {
        throw new InvalidJsonWebEncryptionException(exc);
      }

      throw new InvalidJsonWebEncryptionException();
    }
  }
}
