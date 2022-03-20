import { Optional } from '@guarani/types';

/**
 * JSON Web Key Algorithms Parameters as defined by
 * {@link https://www.rfc-editor.org/rfc/rfc7518.html#section-6 RFC 7518 Section 6}.
 */
export interface JsonWebKeyAlgorithmParams {
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
   * Elliptic Curve X Coordinate.
   */
  readonly x?: Optional<string>;

  /**
   * Elliptic Curve Y Coordinate.
   */
  readonly y?: Optional<string>;

  /**
   * Additional custom parameters.
   */
  readonly [parameter: string]: any;
}
