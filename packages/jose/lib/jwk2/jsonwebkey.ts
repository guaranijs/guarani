import { removeNullishValues } from '@guarani/objects';
import { Optional } from '@guarani/types';

import { KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-json-web-key.exception';
import { JsonWebKeyParams } from './jsonwebkey.params';

export abstract class JsonWebKey {
  /**
   * Native key represented by the JSON Web Key.
   */
  private readonly nativeKey!: KeyObject;

  /**
   * Defines the signature or encryption algorithm allowed to use this key.
   */
  public readonly alg?: Optional<string>;

  /**
   * Elliptic Curve Name.
   */
  public readonly crv?: Optional<string>;

  /**
   * Elliptic Curve Private Key.
   *
   * RSA Private Exponent.
   */
  public readonly d?: Optional<string>;

  /**
   * RSA First Factor CRT Exponent.
   */
  public readonly dp?: Optional<string>;

  /**
   * RSA Second Factor CRT Exponent.
   */
  public readonly dq?: Optional<string>;

  /**
   * RSA Public Exponent.
   */
  public readonly e?: Optional<string>;

  /**
   * Symmetric Key Secret.
   */
  public readonly k?: Optional<string>;

  /**
   * Defines the allowed operations to be performed with the key
   */
  public readonly key_ops?: Optional<string[]>;

  /**
   * Defines the ID of the key.
   */
  public readonly kid?: Optional<string>;

  /**
   * Key type representing the algorithm of the key.
   */
  public readonly kty?: Optional<string>;

  /**
   * RSA Modulus.
   */
  public readonly n?: Optional<string>;

  /**
   * RSA First Prime Factor.
   */
  public readonly p?: Optional<string>;

  /**
   * RSA Second Prime Factor.
   */
  public readonly q?: Optional<string>;

  /**
   * RSA First Factor CRT Coefficient.
   */
  public readonly qi?: Optional<string>;

  /**
   * Defines the usage of the key.
   */
  public readonly use?: Optional<string>;

  /**
   * Elliptic Curve X Coordinate.
   */
  public readonly x?: Optional<string>;

  /**
   * Defines a chain of X.509 certificates of the key.
   */
  public readonly x5c?: Optional<string[]>;

  /**
   * Defines the SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  public readonly x5t?: Optional<string>;

  /**
   * Defines the SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  public readonly 'x5t#S256'?: Optional<string>;

  /**
   * Defines the URL of the X.509 certificate of the key.
   */
  public readonly x5u?: Optional<string>;

  /**
   * Elliptic Curve Y Coordinate.
   */
  public readonly y?: Optional<string>;

  /**
   * Signature of the Constructor of a JSON Web Key.
   *
   * @param params Parameters of the key.
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

    Object.assign(this, removeNullishValues(params));
  }
}
