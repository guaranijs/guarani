import { Nullable, Optional } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-json-web-key.exception';
import { SupportedJsonWebKeyAlgorithm } from '../../jwk/algorithms/types/supported-jsonwebkey-algorithm';
import { JsonWebKey } from '../../jwk/jsonwebkey';
import { SupportedJsonWebSignatureAlgorithm } from './types/supported-jsonwebsignature-algorithm';

/**
 * Abstract Base Class for {@link https://www.rfc-editor.org/rfc/rfc7518.html#section-3 RFC 7518 Section 3}.
 *
 * All JSON Web Signature Algorithms supported by Guarani **MUST** extend this base class
 * and implement its abstract methods.
 */
export abstract class JsonWebSignatureAlgorithm {
  /**
   * Type of JSON Web Key supported by this JSON Web Signature Algorithm.
   */
  protected readonly keyType?: Optional<SupportedJsonWebKeyAlgorithm>;

  /**
   * Hash Algorithm used to Sign and Verify the Messages.
   */
  protected readonly hash: Nullable<string>;

  /**
   * Name of the JSON Web Signature Algorithm.
   */
  protected readonly algorithm: SupportedJsonWebSignatureAlgorithm;

  /**
   * Instantiates a new JSON Web Signature Algorithm to Sign and Verify the Messages.
   *
   * @param hash Hash Algorithm used to Sign and Verify the Messages.
   * @param algorithm Name of the JSON Web Signature Algorithm.
   * @param keyType Type of JSON Web Key supported by this JSON Web Signature Algorithm.
   */
  public constructor(
    hash: Nullable<string>,
    algorithm: SupportedJsonWebSignatureAlgorithm,
    keyType?: Optional<SupportedJsonWebKeyAlgorithm>
  ) {
    this.hash = hash;
    this.algorithm = algorithm;
    this.keyType = keyType;
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public abstract sign(message: Buffer, key?: Optional<JsonWebKey>): Promise<Buffer>;

  /**
   * Checks if the provided Signature matches the provided Message based on the provided JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public abstract verify(signature: Buffer, message: Buffer, key?: Optional<JsonWebKey>): Promise<void>;

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Signature Algorithm.
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

    if (this.keyType !== undefined && key.kty !== this.keyType) {
      throw new InvalidJsonWebKeyException(
        `This JSON Web Signature Algorithm only accepts "${this.keyType}" JSON Web Keys.`
      );
    }
  }
}
