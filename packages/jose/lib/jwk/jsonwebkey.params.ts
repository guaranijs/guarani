import { Optional } from '@guarani/types';

import { SupportedJsonWebKeyAlgorithm } from './algorithms/supported-jsonwebkey-algorithm';

/**
 * Interface defining the supported parameters of a JsonWebKey.
 *
 * The parameters defined here are the default ones defined by
 * {@link https://tools.ietf.org/html/rfc7517 RFC 7517}.
 */
export interface JsonWebKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  readonly kty?: Optional<SupportedJsonWebKeyAlgorithm>;

  /**
   * Defines the usage of the key.
   */
  readonly use?: Optional<string>;

  /**
   * Defines the allowed operations to be performed with the key
   */
  readonly key_ops?: Optional<string[]>;

  /**
   * Defines the signature or encryption algorithm allowed to use this key.
   */
  readonly alg?: Optional<string>;

  /**
   * Defines the ID of the key.
   */
  readonly kid?: Optional<string>;

  /**
   * Defines the URL of the X.509 certificate of the key.
   */
  readonly x5u?: Optional<string>;

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
   * Additional custom parameters.
   */
  readonly [parameter: string]: any;
}
