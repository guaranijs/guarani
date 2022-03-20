import { Dict, Optional } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';
import { SupportedJsonWebKeyAlgorithm } from '../../../jwk/algorithms/supported-jsonwebkey-algorithm';
import { JsonWebKey } from '../../../jwk/jsonwebkey';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../enc/jsonwebencryption-contentencryption.algorithm';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from './supported-jsonwebencryption-keyencryption-algorithm';
import { WrappedKey } from './types/wrapped-key';

/**
 * Implementation of the Section 4 of RFC 7518.
 *
 * This class provides the expected **Key Wrapping Algorithms** that will be used throughout the package.
 *
 * All JWE Algorithms **MUST** inherit from this class and implement its methods.
 */
export abstract class JsonWebEncryptionKeyWrapAlgorithm {
  /**
   * Name of the JSON Web Encryption Key Wrap Algorithm.
   */
  protected readonly algorithm: SupportedJsonWebEncryptionKeyWrapAlgorithm;

  /**
   * Type of JSON Web Key supported by this JSON Web Encryption Key Wrap Algorithm.
   */
  protected readonly keyType: SupportedJsonWebKeyAlgorithm;

  /**
   * Instantiates a new JSON Web Encryption Key Wrap Algorithm to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Algorithm.
   * @param keyType Type of JSON Web Key supported by this JSON Web Encryption Key Wrap Algorithm.
   */
  public constructor(algorithm: SupportedJsonWebEncryptionKeyWrapAlgorithm, keyType: SupportedJsonWebKeyAlgorithm) {
    this.algorithm = algorithm;
    this.keyType = keyType;
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @param header Optional JSON Web Encryption Header containing the additional Parameters.
   * @returns Wrapped Content Encryption Key and optional additional JSON Web Encryption Header Parameters.
   */
  public abstract wrap(
    enc: JsonWebEncryptionContentEncryptionAlgorithm,
    key: JsonWebKey,
    header?: Optional<Dict>
  ): Promise<WrappedKey<Dict>>;

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc JSON Web Encrytpion Content Encryption Algorithm.
   * @param key JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param ek Wrapped Content Encryption Key.
   * @param header Optional JSON Web Encryption Header containing the additional Parameters.
   * @returns Unwrapped Content Encryption Key.
   */
  public abstract unwrap(
    enc: JsonWebEncryptionContentEncryptionAlgorithm,
    key: JsonWebKey,
    ek: Buffer,
    header?: Optional<Dict>
  ): Promise<Buffer>;

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Encryption Key Wrap Algorithm.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected validateJsonWebKey(key: JsonWebKey): void {
    if (!(key instanceof JsonWebKey)) {
      throw new InvalidJsonWebKeyException();
    }

    if (key.alg !== undefined && key.alg !== this.algorithm) {
      throw new InvalidJsonWebKeyException(`This JSON Web Key is intended to be used by the Algorithm "${key.alg}".`);
    }

    if (key.kty !== this.keyType) {
      throw new InvalidJsonWebKeyException(
        `This JSON Web Encryption Key Wrap Algorithm only accepts "${this.keyType}" JSON Web Keys.`
      );
    }
  }
}
