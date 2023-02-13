import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { JsonWebKey } from '../../jwk/jsonwebkey';
import { JsonWebKeyType } from '../../jwk/jsonwebkey-type.type';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';

/**
 * Abstract Base Class for the JSON Web Signature Backend.
 *
 * All JSON Web Signature Backends **MUST** extend this base class and implement its abstract methods.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-3
 */
export abstract class JsonWebSignatureBackend {
  /**
   * Name of the JSON Web Signature Algorithm used by the Backend.
   */
  protected readonly algorithm: JsonWebSignatureAlgorithm;

  /**
   * Hash Algorithm used to Sign and Verify Messages.
   */
  protected readonly hash?: string;

  /**
   * JSON Web Key Type supported by the Backend.
   */
  protected readonly keyType?: JsonWebKeyType;

  /**
   * Instantiates a new JSON Web Signature Backend to Sign and Verify Messages.
   *
   * @param algorithm Name of the JSON Web Signature Algorithm used by the Backend.
   * @param hash Hash Algorithm used to Sign and Verify Messages.
   * @param keyType Type of JSON Web Key supported by this JSON Web Signature Backend.
   */
  public constructor(algorithm: JsonWebSignatureAlgorithm, hash?: string, keyType?: JsonWebKeyType) {
    this.algorithm = algorithm;
    this.hash = hash;
    this.keyType = keyType;
  }

  /**
   * Signs a Message with the provided JSON Web Key.
   *
   * @param message Message to be Signed.
   * @param key JSON Web Key used to Sign the provided Message.
   * @returns Resulting Signature of the provided Message.
   */
  public abstract sign(message: Buffer, key?: JsonWebKey): Promise<Buffer>;

  /**
   * Checks if the provided Signature matches the provided Message based on the provided JSON Web Key.
   *
   * @param signature Signature to be matched against the provided Message.
   * @param message Message to be matched against the provided Signature.
   * @param key JSON Web Key used to verify the Signature and Message.
   */
  public abstract verify(signature: Buffer, message: Buffer, key?: JsonWebKey): Promise<void>;

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Signature Backend.
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
