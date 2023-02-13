import { Buffer } from 'buffer';
import { CipherGCMTypes, createCipheriv, createDecipheriv } from 'crypto';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-jsonwebencryption.exception';
import { JoseException } from '../../../exceptions/jose.exception';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../../jsonwebencryption-content-encryption-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from './jsonwebencryption-content-encryption.backend';

/**
 * Implementation of the AES-GCM JSON Web Encryption Content Encryption Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-5.3
 */
class GcmBackend extends JsonWebEncryptionContentEncryptionBackend {
  /**
   * Size of the Authentication Tag in bytes.
   */
  private readonly authTagLength: number = 16;

  /**
   * Name of the Cipher Algorithm.
   */
  private readonly cipher: CipherGCMTypes;

  /**
   * Instantiates a new AES-GCM JSON Web Encryption Content Encryption Backend to Encrypt and Decrypt a Plaintext.
   *
   * @param algorithm Name of the JSON Web Encryption Content Encryption Backend.
   */
  public constructor(algorithm: JsonWebEncryptionContentEncryptionAlgorithm) {
    const cekSize = Number.parseInt(algorithm.substring(1, 4));

    super(algorithm, cekSize, 96);

    this.cipher = <CipherGCMTypes>`aes-${cekSize}-gcm`;
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
  public async encrypt(plaintext: Buffer, aad: Buffer, iv: Buffer, key: Buffer): Promise<[Buffer, Buffer]> {
    try {
      this.validateInitializationVector(iv);
      this.validateContentEncryptionKey(key);

      const cipher = createCipheriv(this.cipher, key, iv, { authTagLength: this.authTagLength });

      cipher.setAAD(aad);

      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const tag = cipher.getAuthTag();

      return [ciphertext, tag];
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebEncryptionException();
      exception.cause = exc;

      throw exception;
    }
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
    try {
      this.validateInitializationVector(iv);
      this.validateContentEncryptionKey(key);

      const decipher = createDecipheriv(this.cipher, key, iv, { authTagLength: this.authTagLength });

      decipher.setAAD(aad);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

      return decrypted;
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebEncryptionException();
      exception.cause = exc;

      throw exception;
    }
  }
}

/**
 * AES GCM using 128-bit key.
 */
export const A128GCM = new GcmBackend('A128GCM');

/**
 * AES GCM using 192-bit key.
 */
export const A192GCM = new GcmBackend('A192GCM');

/**
 * AES GCM using 256-bit key.
 */
export const A256GCM = new GcmBackend('A256GCM');
