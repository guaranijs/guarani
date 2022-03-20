import { Optional } from '@guarani/types';

import { ExportJsonWebKeyOptions, GenerateJsonWebKeyOptions } from '../types';

/**
 * Options for generating RSA JSON Web Keys.
 */
export interface GenerateRsaKeyOptions extends GenerateJsonWebKeyOptions {
  /**
   * JSON Web Key Algorithm.
   */
  readonly kty: 'RSA';

  /**
   * Size of the Modulus in bits.
   */
  readonly modulus: number;

  /**
   * Public Exponent of the key.
   */
  readonly publicExponent?: Optional<number>;
}

/**
 * Encoding of the RSA Key.
 */
type KeyEncoding = 'der' | 'pem';

/**
 * Format of the RSA Key.
 */
type KeyFormat = 'pkcs1' | 'pkcs8' | 'spki';

/**
 * Type of the RSA Key.
 */
type KeyType = 'private' | 'public';

/**
 * Options for exporting an RSA Key.
 */
export interface ExportRsaKeyOptions<E extends KeyEncoding, F extends KeyFormat, T extends KeyType>
  extends ExportJsonWebKeyOptions {
  /**
   * JSON Web Key Algorithm.
   */
  readonly kty: 'RSA';

  /**
   * Encoding of the exported data.
   */
  readonly encoding: E;

  /**
   * Protocol used to encode the data.
   */
  readonly format: F;

  /**
   * Type of the key to be exported.
   */
  readonly type: T;
}
