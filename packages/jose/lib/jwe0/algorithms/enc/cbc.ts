import { createCipheriv, createDecipheriv, createHmac, timingSafeEqual } from 'crypto';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-json-web-encryption.exception';
import { SupportedHash } from '../../../types';
import { AuthenticatedEncryption } from '../../_types';
import { JWEEncryption } from './jwe-encryption';

/**
 * Implementation of the AES-CBC Content Encryption Algorithm.
 */
class CBCHS2Encryption extends JWEEncryption {
  /**
   * Size of the Content Encryption Key in bits.
   */
  public readonly CEK_SIZE: number;

  /**
   * Size of the Initialization Vector in bits.
   */
  public readonly IV_SIZE: number = 128;

  /**
   * Size of the Encryption Key and the MAC Key.
   */
  private readonly KEY_SIZE: number;

  /**
   * Hash function of the algorithm.
   */
  private readonly HASH: SupportedHash;

  /**
   * Instantiates a new AES Encryption to encrypt and decrypt a Plaintext.
   *
   * @param algorithm Name of the algorithm.
   */
  public constructor(protected readonly algorithm: string) {
    super(algorithm);

    const regex = this.algorithm.match(/A([0-9]{3})CBC-HS([0-9]{3})/);

    if (regex == null) {
      throw new InvalidJsonWebEncryptionException(`Unsupported JWE Encryption "${algorithm}".`);
    }

    this.KEY_SIZE = parseInt(regex[1]);
    this.HASH = <SupportedHash>`SHA${regex[2]}`;
    this.CEK_SIZE = this.KEY_SIZE * 2;
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
  public async encrypt(plaintext: Buffer, aad: Buffer, iv: Buffer, key: Buffer): Promise<AuthenticatedEncryption> {
    this.checkIV(iv);
    this.checkKey(key);

    const macKey = key.subarray(0, this.KEY_SIZE >> 3);
    const encKey = key.subarray(this.KEY_SIZE >> 3);

    const cipher = createCipheriv(`aes-${this.KEY_SIZE}-cbc`, encKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    const tag = this.getAuthTag(ciphertext, iv, aad, macKey);

    return {
      ciphertext: ciphertext.toString('base64url'),
      tag: tag.toString('base64url'),
    };
  }

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
  public async decrypt(ciphertext: Buffer, aad: Buffer, iv: Buffer, tag: Buffer, key: Buffer): Promise<Buffer> {
    this.checkIV(iv);
    this.checkKey(key);

    try {
      const macKey = key.subarray(0, this.KEY_SIZE >> 3);
      const encKey = key.subarray(this.KEY_SIZE >> 3);

      const expectedTag = this.getAuthTag(ciphertext, iv, aad, macKey);

      if (!timingSafeEqual(tag, expectedTag)) {
        throw new InvalidJsonWebEncryptionException();
      }

      const decipher = createDecipheriv(`aes-${this.KEY_SIZE}-cbc`, encKey, iv);

      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

      return plaintext;
    } catch {
      throw new InvalidJsonWebEncryptionException();
    }
  }

  /**
   * Generates the Authentication Tag of the Encryption.
   *
   * @param ciphertext Ciphertext to be encrypted.
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

    return createHmac(this.HASH, key)
      .update(data)
      .digest()
      .slice(0, this.KEY_SIZE >> 3);
  }
}

/**
 * AES_128_CBC_HMAC_SHA_256 Required authenticated encryption algorithm.
 */
export const A128CBC_HS256 = new CBCHS2Encryption('A128CBC-HS256');

/**
 * AES_192_CBC_HMAC_SHA_384 Required authenticated encryption algorithm.
 */
export const A192CBC_HS384 = new CBCHS2Encryption('A192CBC-HS384');

/**
 * AES_256_CBC_HMAC_SHA_512 Required authenticated encryption algorithm.
 */
export const A256CBC_HS512 = new CBCHS2Encryption('A256CBC-HS512');
