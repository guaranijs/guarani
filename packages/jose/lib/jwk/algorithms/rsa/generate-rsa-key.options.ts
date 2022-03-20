import { Optional } from '@guarani/types';

/**
 * RsaKey generation options.
 */
export interface GenerateRsaKeyOptions {
  /**
   * Size of the Modulus in bits.
   */
  readonly modulus: number;

  /**
   * Public Exponent of the key.
   */
  readonly publicExponent?: Optional<number>;
}
