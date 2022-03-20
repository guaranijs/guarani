import { createCipheriv, createDecipheriv, createHmac, timingSafeEqual } from 'crypto';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-json-web-encryption.exception';
import { SupportedJsonWebEncryptionContentEncryptionAlgorithm } from './supported-jsonwebencryption-contentencryption-algorithm';
import { AuthenticatedEncryption } from './authenticated-encryption';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './jsonwebencryption-contentencryption.algorithm';

/**
 * Implementation of the AES-CBC JSON Web Encryption Content Encryption Algorithm.
 */
class CBCHS2ContentEncryptionAlgorithm extends JsonWebEncryptionContentEncryptionAlgorithm {
  /**
   * Size of the Encryption Key and the MAC Key in bits.
   */
  private readonly keySize: number;

  /**
   * Name of the Hash Algorithm.
   */
  private readonly hashAlgorithm: string;

  /**
   * Name of the Cipher Algorithm.
   */
  private readonly cipherAlgorithm: string;

  /**
   * Instantiates a new AES-CBC JSON Web Encryption Content Encryption to Encrypt and Decrypt a Plaintext.
   *
   * @param algorithm Name of the JSON Web Encryption Content Encryption Algorithm.
   */
  public constructor(algorithm: SupportedJsonWebEncryptionContentEncryptionAlgorithm) {
    const regex = /^A([0-9]{3})CBC-HS([0-9]{3})$/;

    const [keySize, hashSize] = regex
      .exec(algorithm)!
      .slice(1)
      .map((value) => Number.parseInt(value));

    super(keySize * 2, 128, algorithm);

    this.keySize = keySize;
    this.hashAlgorithm = `SHA${hashSize}`;
    this.cipherAlgorithm = `aes-${keySize}-cbc`;
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

    const macKey = key.subarray(0, this.keySize >> 3);
    const encKey = key.subarray(this.keySize >> 3);

    const cipher = createCipheriv(this.cipherAlgorithm, encKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    const tag = this.getAuthTag(ciphertext, iv, aad, macKey);

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

    const macKey = key.subarray(0, this.keySize >> 3);
    const encKey = key.subarray(this.keySize >> 3);

    const expectedTag = this.getAuthTag(ciphertext, iv, aad, macKey);

    if (!timingSafeEqual(tag, expectedTag)) {
      throw new InvalidJsonWebEncryptionException();
    }

    const decipher = createDecipheriv(this.cipherAlgorithm, encKey, iv);
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
    const len = aad.length << 3;
    const buf = Buffer.alloc(8);

    buf.writeUInt32BE(Math.floor(len / 2 ** 32), 0);
    buf.writeUInt32BE(len % 2 ** 32, 4);

    const data = Buffer.concat([aad, iv, ciphertext, buf]);

    return createHmac(this.hashAlgorithm, key)
      .update(data)
      .digest()
      .slice(0, this.keySize >> 3);
  }
}

/**
 * AES_128_CBC_HMAC_SHA_256 authenticated encryption algorithm.
 */
export const A128CBC_HS256 = new CBCHS2ContentEncryptionAlgorithm('A128CBC-HS256');

/**
 * AES_192_CBC_HMAC_SHA_384 authenticated encryption algorithm.
 */
export const A192CBC_HS384 = new CBCHS2ContentEncryptionAlgorithm('A192CBC-HS384');

/**
 * AES_256_CBC_HMAC_SHA_512 authenticated encryption algorithm.
 */
export const A256CBC_HS512 = new CBCHS2ContentEncryptionAlgorithm('A256CBC-HS512');
