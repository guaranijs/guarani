import { Optional } from '@guarani/types';

/**
 * Options for Generating an RSA JSON Web Key.
 */
export interface GenerateRsaKeyOptions {
  /**
   * Size of the Modulus in bits.
   */
  readonly modulus: number;

  /**
   * Public Exponent.
   */
  readonly publicExponent?: Optional<number>;
}
