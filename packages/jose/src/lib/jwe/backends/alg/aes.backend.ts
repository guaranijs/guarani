import { Buffer } from 'buffer';
import { createCipheriv, createDecipheriv } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { OctetSequenceKey } from '../../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { JsonWebEncryptionKeyWrapBackend } from './jsonwebencryption-keywrap.backend';

/**
 * Implementation of the JSON Web Encryption AES Key Wrap Backend to Wrap and Unwrap Content Encryption Keys.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-4.4
 */
class AesBackend extends JsonWebEncryptionKeyWrapBackend {
  /**
   * Size of the Content Encryption Key in bits.
   */
  private readonly keySize: number;

  /**
   * Name of the Cipher Algorithm.
   */
  private readonly cipher: string;

  /**
   * Instantiates a new JSON Web Encryption AES Key Wrap Backend to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Backend.
   */
  public constructor(algorithm: JsonWebEncryptionKeyWrapAlgorithm) {
    super(algorithm);

    this.keySize = Number.parseInt(this.algorithm.substring(1, 4));
    this.cipher = `aes${this.keySize}-wrap`;
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Backend.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @returns Generated Content Encryption Key, Wrapped Content Encryption Key and optional JSON Web Encryption Header.
   */
  public async wrap(enc: JsonWebEncryptionContentEncryptionBackend, key: OctetSequenceKey): Promise<[Buffer, Buffer]> {
    this.validateJsonWebKey(key);

    const cipher = createCipheriv(this.cipher, key.cryptoKey, Buffer.alloc(8, 0xa6));
    const cek = await enc.generateContentEncryptionKey();
    const ek = Buffer.concat([cipher.update(cek), cipher.final()]);

    return [cek, ek];
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc JSON Web Encrytpion Content Encryption Backend.
   * @param key JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param ek Wrapped Content Encryption Key.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(
    enc: JsonWebEncryptionContentEncryptionBackend,
    key: OctetSequenceKey,
    ek: Buffer
  ): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const decipher = createDecipheriv(this.cipher, key.cryptoKey, Buffer.alloc(8, 0xa6));
    const cek = Buffer.concat([decipher.update(ek), decipher.final()]);

    enc.validateContentEncryptionKey(cek);

    return cek;
  }

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Encryption Key Wrap Backend.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected override validateJsonWebKey(key: OctetSequenceKey): void {
    super.validateJsonWebKey(key);

    if (key.kty !== 'oct') {
      throw new InvalidJsonWebKeyException(
        'This JSON Web Encryption Key Wrap Algorithm only accepts "oct" JSON Web Keys.'
      );
    }

    const exportedKey = key.cryptoKey.export();

    if (exportedKey.length * 8 !== this.keySize) {
      throw new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.');
    }
  }
}

/**
 * AES Key Wrap with default initial value using 128-bit key.
 */
export const A128KW = new AesBackend('A128KW');

/**
 * AES Key Wrap with default initial value using 192-bit key.
 */
export const A192KW = new AesBackend('A192KW');

/**
 * AES Key Wrap with default initial value using 256-bit key.
 */
export const A256KW = new AesBackend('A256KW');
