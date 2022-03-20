import { Nullable, Optional } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-json-web-key.exception';
import { SupportedJsonWebKeyAlgorithm } from '../../jwk/algorithms/supported-jsonwebkey-algorithm';
import { JsonWebKey } from '../../jwk/jsonwebkey';
import { SupportedJsonWebSignatureAlgorithm } from '../supported-jsonwebsignature-algorithm';

export abstract class JsonWebSignatureAlgorithm {
  /**
   * Denotes the type of JSON Web Key supported by this JSON Web Signature Algorithm.
   */
  protected abstract readonly keyType?: Optional<SupportedJsonWebKeyAlgorithm>;

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
   */
  public constructor(hash: Nullable<string>, algorithm: SupportedJsonWebSignatureAlgorithm) {
    this.hash = hash;
    this.algorithm = algorithm;
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
   * Checks if the provided Signature matches the provided Message based on the provide JSON Web Key.
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
