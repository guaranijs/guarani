import { Buffer } from 'buffer';
import { randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-jsonwebencryption.exception';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../../jsonwebencryption-content-encryption-algorithm.type';

const randomBytesAsync = promisify(randomBytes);

/**
 * Abstract Base Class for the JSON Web Encryption Content Encryption Backends.
 *
 * All JSON Web Encryption Content Encryption Backends **MUST** extend this base class
 * and implement its abstract methods.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-5
 */
export abstract class JsonWebEncryptionContentEncryptionBackend {
  /**
   * Instantiates a new JSON Web Encryption Content Encryption Algorithm to Encrypt and Decrypt a Plaintext.
   *
   * @param algorithm Name of the JSON Web Encryption Content Encryption Backend.
   * @param cekSize Size of the Content Encryption Key in bits.
   * @param ivSize Size of the Initialization Vector in bits.
   */
  public constructor(
    protected readonly algorithm: JsonWebEncryptionContentEncryptionAlgorithm,
    public readonly cekSize: number,
    public readonly ivSize: number,
  ) {}

  /**
   * Generates a new Content Encryption Key.
   */
  public async generateContentEncryptionKey(): Promise<Buffer> {
    return await randomBytesAsync(Math.floor(this.cekSize / 8));
  }

  /**
   * Generates a new Initialization Vector.
   */
  public async generateInitializationVector(): Promise<Buffer> {
    return await randomBytesAsync(Math.floor(this.ivSize / 8));
  }

  /**
   * Checks if the provided Content Encryption Key can be used by the JSON Web Encryption Content Encryption Backend.
   *
   * @param key Content Encryption Key to be checked.
   * @throws {InvalidJsonWebEncryptionException} The provided Content Encryption Key is invalid.
   */
  public validateContentEncryptionKey(key: Buffer): void {
    if (!Buffer.isBuffer(key) || key.length * 8 !== this.cekSize) {
      throw new InvalidJsonWebEncryptionException();
    }
  }

  /**
   * Checks if the provided Initialization Vector can be used by the JSON Web Encryption Content Encryption Algorithm.
   *
   * @param iv Initialization Vector to be checked.
   * @throws {InvalidJsonWebEncryptionException} The provided Initialization Vector is invalid.
   */
  public validateInitializationVector(iv: Buffer): void {
    if (iv.length * 8 !== this.ivSize) {
      throw new InvalidJsonWebEncryptionException();
    }
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
  public abstract encrypt(plaintext: Buffer, aad: Buffer, iv: Buffer, key: Buffer): Promise<[Buffer, Buffer]>;

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
  public abstract decrypt(ciphertext: Buffer, aad: Buffer, iv: Buffer, tag: Buffer, key: Buffer): Promise<Buffer>;
}
