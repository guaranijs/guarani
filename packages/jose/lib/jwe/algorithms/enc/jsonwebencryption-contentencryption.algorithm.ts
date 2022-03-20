import { randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-json-web-encryption.exception';
import { AuthenticatedEncryption } from './authenticated-encryption';
import { SupportedJsonWebEncryptionContentEncryptionAlgorithm } from './supported-jsonwebencryption-contentencryption-algorithm';

const randomBytesAsync = promisify(randomBytes);

/**
 * Abstract Base Class for {@link https://www.rfc-editor.org/rfc/rfc7518.html#section-5 RFC 7518 Section 5}.
 *
 * All JSON Web Encryption Content Encryption Algorithms supported by Guarani **MUST** extend this base class
 * and implement its abstract methods.
 */
export abstract class JsonWebEncryptionContentEncryptionAlgorithm {
  /**
   * Name of the JSON Web Encryption Content Encryption Algorithm.
   */
  protected readonly algorithm: SupportedJsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * Size of the Content Encryption Key in bits.
   */
  public readonly cekSize: number;

  /**
   * Size of the Initialization Vector in bits.
   */
  public readonly ivSize: number;

  /**
   * Instantiates a new JSON Web Encryption Content Encryption Algorithm to Encrypt and Decrypt a Plaintext.
   *
   * @param cekSize Size of the Content Encryption Key in bits.
   * @param ivSize Size of the Initialization Vector in bits.
   * @param algorithm Name of the JSON Web Encryption Content Encryption Algorithm.
   */
  public constructor(cekSize: number, ivSize: number, algorithm: SupportedJsonWebEncryptionContentEncryptionAlgorithm) {
    this.cekSize = cekSize;
    this.ivSize = ivSize;
    this.algorithm = algorithm;
  }

  /**
   * Generates a new Initialization Vector.
   */
  public async generateInitializationVector(): Promise<Buffer> {
    return await randomBytesAsync(Math.floor(this.ivSize / 8));
  }

  /**
   * Generates a new Content Encryption Key.
   */
  public async generateContentEncryptionKey(): Promise<Buffer> {
    return await randomBytesAsync(Math.floor(this.cekSize / 8));
  }

  /**
   * Checks if the provided Initialization Vector can be used by the JSON Web Encryption Content Encryption Algorithm.
   *
   * @param iv Initialization Vector to be checked.
   * @throws {InvalidJsonWebEncryptionException} The provided Initialization Vector is invalid.
   */
  protected validateInitializationVector(iv: Buffer): void {
    if (iv.length * 8 !== this.ivSize) {
      throw new InvalidJsonWebEncryptionException();
    }
  }

  /**
   * Checks if the provided Content Encryption Key can be used by the JSON Web Encryption Content Encryption Algorithm.
   *
   * @param key Content Encryption Key to be checked.
   * @throws {InvalidJsonWebEncryptionException} The provided Content Encryption Key is invalid.
   */
  public validateContentEncryptionKey(key: Buffer): void {
    if (!Buffer.isBuffer(key) || key.length * 8 !== this.cekSize) {
      throw new InvalidJsonWebEncryptionException('Invalid Content Encryption Key.');
    }
  }

  /**
   * Encrypts the provided Plaintext.
   *
   * @param plaintext Plaintext to be Cncrypted.
   * @param aad Additional Authenticated Data.
   * @param iv Initialization Vector.
   * @param key Content Encryption Key used to Encrypt the provided Plaintext.
   * @returns Resulting Ciphertext and Authentication Tag.
   */
  public abstract encrypt(plaintext: Buffer, aad: Buffer, iv: Buffer, key: Buffer): Promise<AuthenticatedEncryption>;

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
