import { createCipheriv, createDecipheriv, CipherGCMTypes } from 'crypto';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-json-web-encryption.exception';
import { SupportedJsonWebEncryptionContentEncryptionAlgorithm } from '../../supported-jsonwebencryption-contentencryption-algorithm';
import { AuthenticatedEncryption } from './authenticated-encryption';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './jsonwebencryption-contentencryption.algorithm';

/**
 * Implementation of the AES Galois/Counter Mode JSON Web Encryption Content Encryption Algorithm.
 */
class AESGCMContentEncryptionAlgorithm extends JsonWebEncryptionContentEncryptionAlgorithm {
  /**
   * Size of the Authentication Tag in bytes.
   */
  private readonly authTagLength: number = 16;

  /**
   * Name of the Cipher Algorithm.
   */
  private readonly cipherAlgorithm: CipherGCMTypes;

  /**
   * Instantiates a new AES Galois/Counter Mode JSON Web Encryption Content Encryption
   * to Encrypt and Decrypt a Plaintext.
   *
   * @param algorithm Name of the JSON Web Encryption Content Encryption Algorithm.
   */
  public constructor(algorithm: SupportedJsonWebEncryptionContentEncryptionAlgorithm) {
    const cekSize = Number.parseInt(algorithm.substring(1, 4));
    super(cekSize, 96, algorithm);

    this.cipherAlgorithm = <CipherGCMTypes>`aes-${cekSize}-cbc`;
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
  public async encrypt(plaintext: Buffer, aad: Buffer, iv: Buffer, key: Buffer): Promise<AuthenticatedEncryption> {
    this.validateInitializationVector(iv);
    this.validateContentEncryptionKey(key);

    const cipher = createCipheriv(this.cipherAlgorithm, key, iv, { authTagLength: this.authTagLength });

    cipher.setAAD(aad);

    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    return { ciphertext, tag };
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

    try {
      const decipher = createDecipheriv(this.cipherAlgorithm, key, iv, { authTagLength: this.authTagLength });

      decipher.setAAD(aad);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

      return decrypted;
    } catch {
      throw new InvalidJsonWebEncryptionException();
    }
  }
}

/**
 * AES GCM using 128-bit key.
 */
export const A128GCM = new AESGCMContentEncryptionAlgorithm('A128GCM');

/**
 * AES GCM using 192-bit key.
 */
export const A192GCM = new AESGCMContentEncryptionAlgorithm('A192GCM');

/**
 * AES GCM using 256-bit key.
 */
export const A256GCM = new AESGCMContentEncryptionAlgorithm('A256GCM');
