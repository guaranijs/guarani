import { removeNullishValues } from '@guarani/objects';
import { Dict, Optional } from '@guarani/types';

import { KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-json-web-key.exception';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from '../jwe/algorithms/alg/supported-jsonwebencryption-keyencryption-algorithm';
import { SupportedJsonWebSignatureAlgorithm } from '../jws/algorithms/supported-jsonwebsignature-algorithm';
import { SupportedJsonWebKeyAlgorithm } from './algorithms/supported-jsonwebkey-algorithm';
import { JsonWebKeyParams } from './jsonwebkey.params';
import { KeyOperation } from './types/key-operation';
import { PublicKeyUse } from './types/public-key-use';

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc7517.html RFC 7517}.
 */
export abstract class JsonWebKey implements JsonWebKeyParams {
  /**
   * NodeJS Crypto Key.
   */
  protected readonly cryptoKey!: KeyObject;

  /**
   * Type of the JSON Web Key.
   */
  public readonly kty!: SupportedJsonWebKeyAlgorithm;

  /**
   * Indicates whether a Public JSON Web Key is used for Plaintext Encryption or Signature Verification.
   */
  public readonly use?: Optional<PublicKeyUse>;

  /**
   * Operations for which the JSON Web Key are intended to be used.
   */
  public readonly key_ops?: Optional<KeyOperation[]>;

  /**
   * Defines the JSON Web Encryption Key Wrap Algorithm or JSON Web Signature Algorithm
   * allowed to use this JSON Web Key.
   */
  public readonly alg?: Optional<SupportedJsonWebEncryptionKeyWrapAlgorithm | SupportedJsonWebSignatureAlgorithm>;

  /**
   * Defines the Identifier of the JSON Web Key.
   */
  public readonly kid?: Optional<string>;

  /**
   * Defines the URL of the X.509 certificate of the JSON Web Key.
   */
  public readonly x5u?: Optional<string>;

  /**
   * Defines a chain of X.509 certificates of the JSON Web Key.
   */
  public readonly x5c?: Optional<string[]>;

  /**
   * Defines the SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  public readonly x5t?: Optional<string>;

  /**
   * Defines the SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  public readonly 'x5t#S256'?: Optional<string>;

  /**
   * Instantiates a new JSON Web Key based on the provided Parameters.
   *
   * @param params Parameters of the JSON Web Key.
   */
  public constructor(params: Optional<JsonWebKeyParams> = {}) {
    if (params.use !== undefined && typeof params.use !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "use".');
    }

    if (params.key_ops !== undefined) {
      if (!Array.isArray(params.key_ops) || params.key_ops.some((p) => typeof p !== 'string')) {
        throw new InvalidJsonWebKeyException('Invalid parameter "key_ops".');
      }

      if (new Set(params.key_ops).size !== params.key_ops.length) {
        throw new InvalidJsonWebKeyException('Parameter "key_ops" cannot have repeated operations.');
      }
    }

    if (params.use !== undefined && params.key_ops !== undefined) {
      const sig = ['sign', 'verify'];
      const enc = ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey', 'deriveKey', 'deriveBits'];

      if (
        (params.use === 'sig' && params.key_ops.some((p) => !sig.includes(p))) ||
        (params.use === 'enc' && params.key_ops.some((p) => !enc.includes(p)))
      ) {
        throw new InvalidJsonWebKeyException('Invalid combination of "use" and "key_ops".');
      }
    }

    if (params.alg !== undefined && typeof params.alg !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "alg".');
    }

    if (params.kid !== undefined && typeof params.kid !== 'string') {
      throw new InvalidJsonWebKeyException('Invalid parameter "kid".');
    }

    if (params.x5u !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5u".');
    }

    if (params.x5c !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5c".');
    }

    if (params.x5t !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5t".');
    }

    if (params['x5t#256'] !== undefined) {
      throw new InvalidJsonWebKeyException('Unsupported parameter "x5t#256".');
    }

    const cryptoKey = this.loadCryptoKey(params);

    Object.defineProperty(this, 'cryptoKey', { value: cryptoKey });

    Object.assign(this, removeNullishValues(params));
  }

  /**
   * Checks if the provided data conforms to the JSON Web Key Specification.
   *
   * @param data Data to be checked.
   */
  public static isJsonWebKey(data: unknown): data is JsonWebKeyParams {
    return typeof data === 'object' && typeof (<JsonWebKeyParams>data).kty === 'string';
  }

  /**
   * Loads the provided JSON Web Key into a NodeJS Crypto Key.
   *
   * @param params Parameters of the JSON Web Key.
   * @returns NodeJS Crypto Key.
   */
  protected abstract loadCryptoKey(params: JsonWebKeyParams): KeyObject;

  /**
   * Exports the data of the JSON Web Key into a String.
   *
   * @param options Options for exporting the data of the JSON Web Key.
   * @returns Resulting String.
   */
  public abstract export(options: Dict): string;

  /**
   * Exports the data of the JSON Web Key into a Buffer.
   *
   * @param options Options for exporing the data of the JSON Web Key.
   * @returns Resulting Buffer.
   */
  public abstract export(options: Dict): Buffer;
}
