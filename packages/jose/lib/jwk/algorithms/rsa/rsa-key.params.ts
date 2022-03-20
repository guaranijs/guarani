import { Optional } from '@guarani/types';
import { JsonWebKeyParams } from '../../jsonwebkey.params';

/**
 * Parameters of the RSA Key.
 */
export interface RsaKeyParams extends JsonWebKeyParams<'RSA'> {
  /**
   * Modulus.
   */
  readonly n: string;

  /**
   * Public Exponent.
   */
  readonly e: string;

  /**
   * Private Exponent.
   */
  readonly d?: Optional<string>;

  /**
   * First Prime Factor.
   */
  readonly p?: Optional<string>;

  /**
   * Second Prime Factor.
   */
  readonly q?: Optional<string>;

  /**
   * First Factor CRT Exponent.
   */
  readonly dp?: Optional<string>;

  /**
   * Second Factor CRT Exponent.
   */
  readonly dq?: Optional<string>;

  /**
   * First Factor CRT Coefficient.
   */
  readonly qi?: Optional<string>;
}
