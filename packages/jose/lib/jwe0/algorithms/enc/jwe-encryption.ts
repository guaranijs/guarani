import { randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-json-web-encryption.exception';
import { AuthenticatedEncryption } from '../../_types';

const randomBytesAsync = promisify(randomBytes);

/**
 * Implementation of the Section 5 of RFC 7518.
 *
 * This class provides the expected **Content Encryption Algorithms**
 * that will be used throughout the package.
 *
 * All JWE Encryptions **MUST** inherit from this class and
 * implement its methods.
 */
export abstract class JWEEncryption {
  /**
   * Size of the Content Encryption Key in bits.
   */
  public abstract readonly CEK_SIZE: number;

  /**
   * Size of the Initialization Vector in bits.
   */
  public abstract readonly IV_SIZE: number;

  /**
   * Instantiates a new JWE Encryption to encrypt and decrypt a Plaintext.
   *
   * @param algorithm Name of the algorithm.
   */
  public constructor(protected readonly algorithm: string) {}

  /**
   * Generates a new Content Encryption Key.
   *
   * @returns Generated Content Encryption Key.
   */
  public async generateCEK(): Promise<Buffer> {
    return await randomBytesAsync(Math.floor(this.CEK_SIZE / 8));
  }

  /**
   * Generates a new Initialization Vector.
   *
   * @returns Generated Initialization Vector.
   */
  public async generateIV(): Promise<Buffer> {
    return await randomBytesAsync(Math.floor(this.IV_SIZE / 8));
  }

  /**
   * Validates if the provided Initialization Vector is valid to the algorithm.
   *
   * @param iv Initialization Vector to be validated.
   */
  protected checkIV(iv: Buffer): void {
    if (iv.length * 8 !== this.IV_SIZE) {
      throw new InvalidJsonWebEncryptionException();
    }
  }

  /**
   * Checks if a key can be used by the requesting algorithm.
   *
   * @param key Key to be checked.
   * @throws {InvalidJsonWebEncryptionException} The provided key is invalid.
   */
  protected checkKey(key: Buffer): void {
    if (!Buffer.isBuffer(key) || key.length * 8 !== this.CEK_SIZE) {
      throw new InvalidJsonWebEncryptionException('Invalid key.');
    }
  }

  /**
   * Encrypts the provided plaintext.
   *
   * @param plaintext Plaintext to be encrypted.
   * @param aad Additional Authenticated Data.
   * @param iv Initialization Vector.
   * @param key Content Encryption Key used to encrypt the plaintext.
   * @returns Resulting Ciphertext and Authentication Tag.
   */
  public abstract encrypt(plaintext: Buffer, aad: Buffer, iv: Buffer, key: Buffer): Promise<AuthenticatedEncryption>;

  /**
   * Decrypts the provided ciphertext back to its original Buffer representaion.
   *
   * @param ciphertext Ciphertext to be decrypted.
   * @param aad Additional Authenticated Data.
   * @param iv Initialization Vector.
   * @param tag Authentication Tag.
   * @param key Content Encryption Key used to decrypt the plaintext.
   * @throws {InvalidJsonWebEncryptionException} Could not decrypt the ciphertext.
   * @returns Buffer representation of the decrypted plaintext.
   */
  public abstract decrypt(ciphertext: Buffer, aad: Buffer, iv: Buffer, tag: Buffer, key: Buffer): Promise<Buffer>;
}
