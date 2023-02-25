import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { JsonWebKey } from '../../../jwk/jsonwebkey';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';

/**
 * Abstract Base Class for the JSON Web Encryption Key Wrap Backened.
 *
 * All JSON Web Encryption Key Wrap Backened **MUST** extend this base class and implement its abstract methods.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-4
 */
export abstract class JsonWebEncryptionKeyWrapBackend {
  /**
   * Name of the JSON Web Encryption Key Wrap Backend.
   */
  protected readonly algorithm: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * Instantiates a new JSON Web Encryption Key Wrap Backend to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Backend.
   * @param keyType Type of JSON Web Key supported by this JSON Web Encryption Key Wrap Backend.
   */
  public constructor(algorithm: JsonWebEncryptionKeyWrapAlgorithm) {
    this.algorithm = algorithm;
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param enc JSON Web Encryption Content Encryption Backend.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @param header Optional JSON Web Encryption Header containing the additional Parameters.
   * @returns Generated Content Encryption Key, Wrapped Content Encryption Key and optional JSON Web Encryption Header.
   */
  public abstract wrap(
    enc: JsonWebEncryptionContentEncryptionBackend,
    key: JsonWebKey,
    header?: Record<string, unknown>
  ): Promise<[Buffer, Buffer, Record<string, unknown>?]>;

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc JSON Web Encrytpion Content Encryption Backend.
   * @param key JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param ek Wrapped Content Encryption Key.
   * @param header Optional JSON Web Encryption Header containing the additional Parameters.
   * @returns Unwrapped Content Encryption Key.
   */
  public abstract unwrap(
    enc: JsonWebEncryptionContentEncryptionBackend,
    key: JsonWebKey,
    ek: Buffer,
    header?: Record<string, unknown>
  ): Promise<Buffer>;

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Encryption Key Wrap Backend.
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
  }
}
