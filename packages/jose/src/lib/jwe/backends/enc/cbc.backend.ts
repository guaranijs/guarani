import { Buffer } from 'buffer';
import { createCipheriv, createDecipheriv, createHmac, timingSafeEqual } from 'crypto';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-jsonwebencryption.exception';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../../jsonwebencryption-content-encryption-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from './jsonwebencryption-content-encryption.backend';

/**
 * Implementation of the AES-CBC JSON Web Encryption Content Encryption Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-5.2
 */
class CbcBackend extends JsonWebEncryptionContentEncryptionBackend {
  /**
   * Size of the Encryption Key and the MAC Key in bits.
   */
  private readonly keySize: number;

  /**
   * Name of the Hash Algorithm.
   */
  private readonly hash: string;

  /**
   * Name of the Cipher Algorithm.
   */
  private readonly cipher: string;

  /**
   * Instantiates a new AES-CBC JSON Web Encryption Content Encryption Backend to Encrypt and Decrypt a Plaintext.
   *
   * @param algorithm Name of the JSON Web Encryption Content Encryption Backend.
   */
  public constructor(protected override readonly algorithm: JsonWebEncryptionContentEncryptionAlgorithm) {
    const regex = /^A([0-9]{3})CBC-HS([0-9]{3})$/;

    const [keySize, hashSize] = <[number, number]>regex
      .exec(algorithm)!
      .slice(1)
      .map((value) => Number.parseInt(value));

    super(algorithm, keySize * 2, 128);

    this.keySize = keySize;
    this.hash = `sha${hashSize}`;
    this.cipher = `aes-${keySize}-cbc`;
  }

  /**
   * Encrypts the provided Plaintext.
   *
   * @param plaintext Plaintext to be Encrypted.
   * @param aad Additional Authenticated Data.
   * @param iv Initialization Vector.
   * @param key Content Encryption Key used to Encrypt the provided Plaintext.
   * @returns Resulting Ciphertext and Authentication Tag.
   */
  public async encrypt(plaintext: Buffer, aad: Buffer, iv: Buffer, key: Buffer): Promise<[Buffer, Buffer]> {
    this.validateInitializationVector(iv);
    this.validateContentEncryptionKey(key);

    const macKey = key.subarray(0, this.keySize >> 3);
    const encKey = key.subarray(this.keySize >> 3);

    const cipher = createCipheriv(this.cipher, encKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    const tag = this.getAuthTag(ciphertext, iv, aad, macKey);

    return [ciphertext, tag];
  }

  /**
   * Decrypts the provided Ciphertext back to its original Plaintext.
   *
   * @param ciphertext Ciphertext to be Decrypted.
   * @param aad Additional Authenticated Data.
   * @param iv Initialization Vector.
   * @param tag Authentication Tag.
   * @param key Content Encryption Key used to Decrypt the provided Ciphertext.
   * @returns Resulting Plaintext.
   */
  public async decrypt(ciphertext: Buffer, aad: Buffer, iv: Buffer, tag: Buffer, key: Buffer): Promise<Buffer> {
    this.validateInitializationVector(iv);
    this.validateContentEncryptionKey(key);

    const macKey = key.subarray(0, this.keySize >> 3);
    const encKey = key.subarray(this.keySize >> 3);

    const expectedTag = this.getAuthTag(ciphertext, iv, aad, macKey);

    if (tag.length !== expectedTag.length || !timingSafeEqual(tag, expectedTag)) {
      throw new InvalidJsonWebEncryptionException();
    }

    const decipher = createDecipheriv(this.cipher, encKey, iv);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return plaintext;
  }

  /**
   * Generates the Authentication Tag of the provided Ciphertext.
   *
   * @param ciphertext Ciphertext to be Decrypted.
   * @param iv Initialization Vector.
   * @param aad Additional Authenticated Data.
   * @param key Content Encryption Key.
   * @returns Authentication Tag.
   */
  private getAuthTag(ciphertext: Buffer, iv: Buffer, aad: Buffer, key: Buffer): Buffer {
    const length = aad.length << 3;
    const buffer = Buffer.alloc(8);

    buffer.writeUInt32BE(Math.floor(length / 2 ** 32), 0);
    buffer.writeUInt32BE(length % 2 ** 32, 4);

    const data = Buffer.concat([aad, iv, ciphertext, buffer]);

    return createHmac(this.hash, key)
      .update(data)
      .digest()
      .slice(0, this.keySize >> 3);
  }
}

/**
 * AES_128_CBC_HMAC_SHA_256 authenticated encryption algorithm.
 */
export const A128CBC_HS256 = new CbcBackend('A128CBC-HS256');

/**
 * AES_192_CBC_HMAC_SHA_384 authenticated encryption algorithm.
 */
export const A192CBC_HS384 = new CbcBackend('A192CBC-HS384');

/**
 * AES_256_CBC_HMAC_SHA_512 authenticated encryption algorithm.
 */
export const A256CBC_HS512 = new CbcBackend('A256CBC-HS512');
