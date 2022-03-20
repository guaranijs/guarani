import { randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-json-web-encryption.exception';
import { SupportedJsonWebEncryptionContentEncryptionAlgorithm } from '../../supported-jsonwebencryption-contentencryption-algorithm';
import { AuthenticatedEncryption } from './authenticated-encryption';

const randomBytesAsync = promisify(randomBytes);

/**
 * Implementation of the Section 5 of RFC 7518.
 *
 * This class provides the expected **Content Encryption Algorithms** that will be used throughout the package.
 *
 * All JWE Encryptions **MUST** inherit from this class and implement its methods.
 */
export abstract class JsonWebEncryptionContentEncryptionAlgorithm {
  /**
   * Size of the Content Encryption Key in bits.
   */
  protected readonly cekSize: number;

  /**
   * Size of the Initialization Vector in bits.
   */
  protected readonly ivSize: number;

  /**
   * Name of the JSON Web Encryption Content Encryption Algorithm.
   */
  protected readonly algorithm: SupportedJsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * Instantiates a new JWE Encryption to encrypt and decrypt a Plaintext.
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
   * Validates if the provided Initialization Vector is valid to the algorithm.
   *
   * @param iv Initialization Vector to be validated.
   */
  protected validateInitializationVector(iv: Buffer): void {
    if (iv.length * 8 !== this.ivSize) {
      throw new InvalidJsonWebEncryptionException();
    }
  }

  /**
   * Checks if a key can be used by the requesting algorithm.
   *
   * @param key Key to be checked.
   * @throws {InvalidJsonWebEncryptionException} The provided key is invalid.
   */
  protected validateContentEncryptionKey(key: Buffer): void {
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
