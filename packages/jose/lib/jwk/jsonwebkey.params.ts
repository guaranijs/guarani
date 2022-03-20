import { Optional } from '@guarani/types';

import { JsonWebKeyAlgorithmParams } from '../jwa/jwk/jsonwebkey-algorithm.params';
import { JsonWebKeyOptions } from './jsonwebkey.options';

/**
 * Interface defining the supported parameters of a JSON Web Key.
 *
 * The JWK Parameters are the ones defined by {@link https://tools.ietf.org/html/rfc7517 RFC 7517}.
 *
 * The JWKA Parameters are the ones defined by {@link https://www.rfc-editor.org/rfc/rfc7518.html#section-6 RFC 7518 Section 6}.
 */
export interface JsonWebKeyParams extends JsonWebKeyAlgorithmParams, JsonWebKeyOptions {
  /**
   * Defines the signature or encryption algorithm allowed to use this key.
   */
  readonly alg?: Optional<string>;

  /**
   * Elliptic Curve Name.
   */
  readonly crv?: Optional<string>;

  /**
   * Elliptic Curve Private Key.
   *
   * RSA Private Exponent.
   */
  readonly d?: Optional<string>;

  /**
   * RSA First Factor CRT Exponent.
   */
  readonly dp?: Optional<string>;

  /**
   * RSA Second Factor CRT Exponent.
   */
  readonly dq?: Optional<string>;

  /**
   * RSA Public Exponent.
   */
  readonly e?: Optional<string>;

  /**
   * Symmetric Key Secret.
   */
  readonly k?: Optional<string>;

  /**
   * Defines the allowed operations to be performed with the key
   */
  readonly key_ops?: Optional<string[]>;

  /**
   * Defines the ID of the key.
   */
  readonly kid?: Optional<string>;

  /**
   * Key type representing the algorithm of the key.
   */
  readonly kty: string;

  /**
   * RSA Modulus.
   */
  readonly n?: Optional<string>;

  /**
   * RSA First Prime Factor.
   */
  readonly p?: Optional<string>;

  /**
   * RSA Second Prime Factor.
   */
  readonly q?: Optional<string>;

  /**
   * RSA First Factor CRT Coefficient.
   */
  readonly qi?: Optional<string>;

  /**
   * Defines the usage of the key.
   */
  readonly use?: Optional<string>;

  /**
   * Elliptic Curve X Coordinate.
   */
  readonly x?: Optional<string>;

  /**
   * Defines a chain of X.509 certificates of the key.
   */
  readonly x5c?: Optional<string[]>;

  /**
   * Defines the SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  readonly x5t?: Optional<string>;

  /**
   * Defines the SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  readonly 'x5t#S256'?: Optional<string>;

  /**
   * Defines the URL of the X.509 certificate of the key.
   */
  readonly x5u?: Optional<string>;

  /**
   * Elliptic Curve Y Coordinate.
   */
  readonly y?: Optional<string>;
}
