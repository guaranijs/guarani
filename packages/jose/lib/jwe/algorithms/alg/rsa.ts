import { Dict, Optional } from '@guarani/types';

import { KeyObject, privateDecrypt, publicEncrypt } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { RsaPadding } from '../../../jwk/algorithms/rsa/types/rsa-padding';
import { RsaKey } from '../../../jwk/algorithms/rsa/rsa.key';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../enc/jsonwebencryption-contentencryption.algorithm';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap.algorithm';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from './types/supported-jsonwebencryption-keyencryption-algorithm';
import { WrappedKey } from './types/wrapped-key';

/**
 * Implementation of the RSA JSON Web Encryption Key Wrap Algorithm.
 */
class RSAKeyWrapAlgorithm extends JsonWebEncryptionKeyWrapAlgorithm {
  /**
   * RSA Encryption Padding used by the JSON Web Encryption Key Wrap Algorithm.
   */
  private readonly padding: RsaPadding;

  /**
   * Name of the Hash Algorithm.
   */
  private readonly hashAlgorithm?: Optional<string>;

  /**
   * Instantiates a new JSON Web Encryption RSA Key Wrap Algorithm to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Algorithm.
   * @param padding RSA Encryption Padding used by the JSON Web Encryption Key Wrap Algorithm.
   * @param hashAlgorithm Name of the Hash Algorithm.
   */
  public constructor(
    algorithm: SupportedJsonWebEncryptionKeyWrapAlgorithm,
    padding: RsaPadding,
    hashAlgorithm?: Optional<string>
  ) {
    super(algorithm, 'RSA');

    this.padding = padding;
    this.hashAlgorithm = hashAlgorithm;
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @returns Wrapped Content Encryption Key and optional additional JSON Web Encryption Header Parameters.
   */
  public async wrap(enc: JsonWebEncryptionContentEncryptionAlgorithm, key: RsaKey): Promise<WrappedKey<Dict>> {
    this.validateJsonWebKey(key);

    const cryptoKey = <KeyObject>Reflect.get(key, 'cryptoKey');

    const cek = await enc.generateContentEncryptionKey();
    const ek = publicEncrypt({ key: cryptoKey, oaepHash: this.hashAlgorithm, padding: this.padding }, cek);

    return { cek, ek };
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param ek Wrapped Content Encryption Key.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(enc: JsonWebEncryptionContentEncryptionAlgorithm, key: RsaKey, ek: Buffer): Promise<Buffer> {
    this.validateJsonWebKey(key);

    if (key.d === undefined) {
      throw new InvalidJsonWebKeyException(
        'An RSA Private JSON Web Key is needed to Unwrap the provided Wrapped Content Encryption Key.'
      );
    }

    const cryptoKey = <KeyObject>Reflect.get(key, 'cryptoKey');

    const cek = privateDecrypt({ key: cryptoKey, oaepHash: this.hashAlgorithm, padding: this.padding }, ek);

    enc.validateContentEncryptionKey(cek);

    return cek;
  }
}

/**
 * RSAES-PKCS1-v1_5.
 */
export const RSA1_5 = new RSAKeyWrapAlgorithm('RSA1_5', RsaPadding.PKCS1);

/**
 * RSAES OAEP using default parameters.
 */
export const RSA_OAEP = new RSAKeyWrapAlgorithm('RSA-OAEP', RsaPadding.OAEP, 'SHA1');

/**
 * RSAES OAEP using SHA-256 and MGF1 with SHA-256.
 */
export const RSA_OAEP_256 = new RSAKeyWrapAlgorithm('RSA-OAEP-256', RsaPadding.OAEP, 'SHA256');

/**
 * RSAES OAEP using SHA-384 and MGF1 with SHA-384.
 */
export const RSA_OAEP_384 = new RSAKeyWrapAlgorithm('RSA-OAEP-384', RsaPadding.OAEP, 'SHA384');

/**
 * RSAES OAEP using SHA-512 and MGF1 with SHA-512.
 */
export const RSA_OAEP_512 = new RSAKeyWrapAlgorithm('RSA-OAEP-512', RsaPadding.OAEP, 'SHA512');
