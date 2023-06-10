import { Buffer } from 'buffer';
import { constants, privateDecrypt, publicEncrypt, RsaPrivateKey } from 'crypto';

import { Nullable } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { RsaKey } from '../../../jwk/backends/rsa/rsa.key';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { JsonWebEncryptionKeyWrapBackend } from './jsonwebencryption-keywrap.backend';

/**
 * Implementation of the JSON Web Encryption RSA Key Wrap Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-4.2
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-4.3
 */
class RsaBackend extends JsonWebEncryptionKeyWrapBackend {
  /**
   * Instantiates a new JSON Web Encryption RSA Key Wrap Backend to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Backend.
   * @param padding RSA Encryption Padding used by the JSON Web Encryption Key Wrap Backend.
   * @param hash Name of the Hash Algorithm.
   */
  public constructor(
    protected override readonly algorithm: JsonWebEncryptionKeyWrapAlgorithm,
    private readonly padding: number,
    private readonly hash: Nullable<string> = null
  ) {
    super(algorithm);
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param contentEncryptionBackend JSON Web Encryption Content Encryption Backend.
   * @param wrapKey JSON Web Key used to Wrap the provided Content Encryption Key.
   * @returns Generated Content Encryption Key, Wrapped Content Encryption Key and optional JSON Web Encryption Header.
   */
  public async wrap(
    contentEncryptionBackend: JsonWebEncryptionContentEncryptionBackend,
    wrapKey: RsaKey
  ): Promise<[Buffer, Buffer]> {
    this.validateJsonWebKey(wrapKey);

    const contentEncryptionKey = await contentEncryptionBackend.generateContentEncryptionKey();

    const key: RsaPrivateKey = { key: wrapKey.cryptoKey, padding: this.padding };

    if (this.hash !== null) {
      key.oaepHash = this.hash;
    }

    const wrappedKey = publicEncrypt(key, contentEncryptionKey);

    return [contentEncryptionKey, wrappedKey];
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param contentEncryptionBackend JSON Web Encrytpion Content Encryption Backend.
   * @param unwrapKey JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param wrappedKey Wrapped Content Encryption Key.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(
    contentEncryptionBackend: JsonWebEncryptionContentEncryptionBackend,
    unwrapKey: RsaKey,
    wrappedKey: Buffer
  ): Promise<Buffer> {
    this.validateJsonWebKey(unwrapKey);

    const { cryptoKey } = unwrapKey;

    if (cryptoKey.type !== 'private') {
      throw new InvalidJsonWebKeyException(
        'The provided JSON Web Key cannot be used to Unwrap a Wrapped Content Encryption Key.'
      );
    }

    const key: RsaPrivateKey = { key: cryptoKey, padding: this.padding };

    if (this.hash !== null) {
      key.oaepHash = this.hash;
    }

    const contentEncryptionKey = privateDecrypt(key, wrappedKey);

    contentEncryptionBackend.validateContentEncryptionKey(contentEncryptionKey);

    return contentEncryptionKey;
  }

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Encryption Key Wrap Backend.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected override validateJsonWebKey(key: RsaKey): void {
    super.validateJsonWebKey(key);

    if (key.kty !== 'RSA') {
      throw new InvalidJsonWebKeyException(
        `The JSON Web Encryption Key Wrap Algorithm "${this.algorithm}" only accepts "RSA" JSON Web Keys.`
      );
    }
  }
}

/**
 * RSAES-PKCS1-v1_5.
 */
export const RSA1_5 = new RsaBackend('RSA1_5', constants.RSA_PKCS1_PADDING);

/**
 * RSAES OAEP using default parameters.
 */
export const RSA_OAEP = new RsaBackend('RSA-OAEP', constants.RSA_PKCS1_OAEP_PADDING, 'SHA1');

/**
 * RSAES OAEP using SHA-256 and MGF1 with SHA-256.
 */
export const RSA_OAEP_256 = new RsaBackend('RSA-OAEP-256', constants.RSA_PKCS1_OAEP_PADDING, 'SHA256');

/**
 * RSAES OAEP using SHA-384 and MGF1 with SHA-384.
 */
export const RSA_OAEP_384 = new RsaBackend('RSA-OAEP-384', constants.RSA_PKCS1_OAEP_PADDING, 'SHA384');

/**
 * RSAES OAEP using SHA-512 and MGF1 with SHA-512.
 */
export const RSA_OAEP_512 = new RsaBackend('RSA-OAEP-512', constants.RSA_PKCS1_OAEP_PADDING, 'SHA512');
