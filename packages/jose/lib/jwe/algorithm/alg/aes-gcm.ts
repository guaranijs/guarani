import { CipherGCMTypes, createCipheriv, createDecipheriv, KeyObject, randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { OctKey } from '../../../jwk/algorithms/oct/oct.key';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../enc/jsonwebencryption-contentencryption.algorithm';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap.algorithm';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from './supported-jsonwebencryption-keyencryption-algorithm';
import { AesGcmWrappedKeyParams } from './types/aes-gcm-wrapped-key.params';
import { WrappedKey } from './types/wrapped-key';

const randomBytesAsync = promisify(randomBytes);

/**
 * Implementation of the AES-GCM JSON Web Encryption Key Wrap Algorithm.
 */
export class AesGcmKeyWrapAlgorithm extends JsonWebEncryptionKeyWrapAlgorithm {
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
  private readonly cipherAlgorithm: CipherGCMTypes;

  /**
   * Instantiates a new JSON Web Encryption AES-GCM Key Wrap Algorithm to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Algorithm.
   */
  public constructor(algorithm: SupportedJsonWebEncryptionKeyWrapAlgorithm) {
    super(algorithm, 'oct');

    this.keySize = Number.parseInt(this.algorithm.substring(1, 4));
    this.cipherAlgorithm = <CipherGCMTypes>`aes${this.keySize}-gcm`;
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @returns Wrapped Content Encryption Key and optional additional JSON Web Encryption Header Parameters.
   */
  public async wrap(
    enc: JsonWebEncryptionContentEncryptionAlgorithm,
    key: OctKey
  ): Promise<WrappedKey<AesGcmWrappedKeyParams>> {
    this.validateJsonWebKey(key);

    const iv = await randomBytesAsync(this.ivSize / 8);

    const cryptoKey = <KeyObject>Reflect.get(key, 'cryptoKey');
    const cipher = createCipheriv(this.cipherAlgorithm, cryptoKey, iv, { authTagLength: this.authTagLength });

    cipher.setAAD(Buffer.alloc(0));

    const cek = await enc.generateContentEncryptionKey();
    const ek = Buffer.concat([cipher.update(cek), cipher.final()]);
    const tag = cipher.getAuthTag();

    return { cek, ek, additionalHeaderParams: { iv: iv.toString('base64url'), tag: tag.toString('base64url') } };
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param ek Wrapped Content Encryption Key.
   * @param header JSON Web Encryption Header containing the additional Parameters.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(
    enc: JsonWebEncryptionContentEncryptionAlgorithm,
    key: OctKey,
    ek: Buffer,
    header: AesGcmWrappedKeyParams
  ): Promise<Buffer> {
    this.validateJsonWebKey(key);

    const iv = Buffer.from(header.iv, 'base64url');
    const tag = Buffer.from(header.tag, 'base64url');

    const cryptoKey = <KeyObject>Reflect.get(key, 'cryptoKey');
    const decipher = createDecipheriv(this.cipherAlgorithm, cryptoKey, iv, { authTagLength: this.authTagLength });

    decipher.setAAD(Buffer.alloc(0));
    decipher.setAuthTag(tag);

    const cek = Buffer.concat([decipher.update(ek), decipher.final()]);

    enc.validateContentEncryptionKey(cek);

    return cek;
  }

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Encryption AES-GCM Key Wrap Algorithm.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected validateJsonWebKey(key: OctKey): void {
    super.validateJsonWebKey(key);

    const exportedKey = key.export({ encoding: 'buffer' });

    if (exportedKey.length * 8 !== this.keySize) {
      throw new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.');
    }
  }
}

/**
 * Key wrapping with AES Galois/Counter Mode using 128-bit key.
 */
export const A128GCMKW = new AesGcmKeyWrapAlgorithm('A128GCMKW');

/**
 * Key wrapping with AES Galois/Counter Mode using 192-bit key.
 */
export const A192GCMKW = new AesGcmKeyWrapAlgorithm('A192GCMKW');

/**
 * Key wrapping with AES Galois/Counter Mode using 256-bit key.
 */
export const A256GCMKW = new AesGcmKeyWrapAlgorithm('A256GCMKW');
