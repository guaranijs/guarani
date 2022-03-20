import { Dict } from '@guarani/types';

import { createCipheriv, createDecipheriv, KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { OctKey } from '../../../jwk/algorithms/oct/oct.key';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from './supported-jsonwebencryption-keyencryption-algorithm';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap.algorithm';
import { WrappedKey } from './types/wrapped-key';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../enc/jsonwebencryption-contentencryption.algorithm';

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
   * Instantiates a new JSON Web Encryption AES Key Wrap Algorithm to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Algorithm.
   */
  public constructor(algorithm: SupportedJsonWebEncryptionKeyWrapAlgorithm) {
    super(algorithm, 'oct');

    this.keySize = Number.parseInt(this.algorithm.substring(1, 4));
    this.cipherAlgorithm = `aes${this.keySize}-wrap`;
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @returns Wrapped Content Encryption Key and optional additional JSON Web Encryption Header Parameters.
   */
  public async wrap(enc: JsonWebEncryptionContentEncryptionAlgorithm, key: OctKey): Promise<WrappedKey<Dict>> {
    this.validateJsonWebKey(key);

    const cryptoKey = <KeyObject>Reflect.get(key, 'cryptoKey');
    const cipher = createCipheriv(this.cipherAlgorithm, cryptoKey, Buffer.alloc(8, 0xa6));

    const cek = await enc.generateContentEncryptionKey();
    const ek = Buffer.concat([cipher.update(cek), cipher.final()]);

    return { cek, ek };
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param ek Wrapped Content Encryption Key.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(enc: JsonWebEncryptionContentEncryptionAlgorithm, key: OctKey, ek: Buffer): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const cryptoKey = <KeyObject>Reflect.get(key, 'cryptoKey');
    const decipher = createDecipheriv(this.cipherAlgorithm, cryptoKey, Buffer.alloc(8, 0xa6));

    const cek = Buffer.concat([decipher.update(ek), decipher.final()]);

    enc.validateContentEncryptionKey(cek);

    return cek;
  }

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Encryption AES Key Wrap Algorithm.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected validateJsonWebKey(key: OctKey): void {
    super.validateJsonWebKey(key);

    const exportedKey = key.export({ encoding: 'buffer' });

    if (exportedKey.length * 8 !== this.keySize) {
      throw new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.');
    }
  }
}

/**
 * AES Key Wrap with default initial value using 128-bit key.
 */
export const A128KW = new AesKeyWrapAlgorithm('A128KW');

/**
 * AES Key Wrap with default initial value using 192-bit key.
 */
export const A192KW = new AesKeyWrapAlgorithm('A192KW');

/**
 * AES Key Wrap with default initial value using 256-bit key.
 */
export const A256KW = new AesKeyWrapAlgorithm('A256KW');
