import { Buffer } from 'buffer';
import { CipherGCMTypes, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { OctetSequenceKey } from '../../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { JsonWebEncryptionKeyWrapBackend } from './jsonwebencryption-keywrap.backend';

const randomBytesAsync = promisify(randomBytes);

/**
 * Implementation of the JSON Web Encryption AES-GCM Key Wrap Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-4.7
 */
class GcmBackend extends JsonWebEncryptionKeyWrapBackend {
  /**
   * Size of the Initialization Vector in bits.
   */
  private readonly ivSize: number = 96;

  /**
   * Size of the Authentication Tag in bytes.
   */
  private readonly authTagLength: number = 16;

  /**
   * Size of the Content Encryption Key in bits.
   */
  private readonly keySize: number;

  /**
   * Name of the Cipher Algorithm.
   */
  private readonly cipher: CipherGCMTypes;

  /**
   * Instantiates a new JSON Web Encryption AES-GCM Key Wrap Backend to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Backend.
   */
  public constructor(algorithm: JsonWebEncryptionKeyWrapAlgorithm) {
    super(algorithm);

    this.keySize = Number.parseInt(this.algorithm.substring(1, 4));
    this.cipher = <CipherGCMTypes>`aes-${this.keySize}-gcm`;
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Backend.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @returns Wrapped Content Encryption Key and optional additional JSON Web Encryption Header Parameters.
   */
  public async wrap(
    enc: JsonWebEncryptionContentEncryptionBackend,
    key: OctetSequenceKey
  ): Promise<[Buffer, Buffer, Record<string, unknown>]> {
    this.validateJsonWebKey(key);

    const iv = await randomBytesAsync(this.ivSize / 8);

    const cipher = createCipheriv(this.cipher, key.cryptoKey, iv, { authTagLength: this.authTagLength });

    cipher.setAAD(Buffer.alloc(0));

    const cek = await enc.generateContentEncryptionKey();
    const ek = Buffer.concat([cipher.update(cek), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [cek, ek, { iv: iv.toString('base64url'), tag: tag.toString('base64url') }];
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Backend.
   * @param key JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param ek Wrapped Content Encryption Key.
   * @param header JSON Web Encryption Header containing the additional Parameters.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(
    enc: JsonWebEncryptionContentEncryptionBackend,
    key: OctetSequenceKey,
    ek: Buffer,
    header: Record<string, unknown>
  ): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const iv = Buffer.from(<string>header.iv, 'base64url');
    const tag = Buffer.from(<string>header.tag, 'base64url');

    const decipher = createDecipheriv(this.cipher, key.cryptoKey, iv, { authTagLength: this.authTagLength });

    decipher.setAAD(Buffer.alloc(0));
    decipher.setAuthTag(tag);

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
 * Key wrapping with AES GCM using 128-bit key.
 */
export const A128GCMKW = new GcmBackend('A128GCMKW');

/**
 * Key wrapping with AES GCM using 192-bit key.
 */
export const A192GCMKW = new GcmBackend('A192GCMKW');

/**
 * Key wrapping with AES GCM using 256-bit key.
 */
export const A256GCMKW = new GcmBackend('A256GCMKW');
