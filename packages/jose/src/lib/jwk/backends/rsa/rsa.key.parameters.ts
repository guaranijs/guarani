import { JsonWebKeyParameters } from '../../jsonwebkey.parameters';

/**
 * Parameters of the RSA JSON Web Key.
 */
export interface RsaKeyParameters extends JsonWebKeyParameters {
  /**
   * RSA JSON Web Key Type.
   */
  readonly kty: 'RSA';

  /**
   * RSA Modulus.
   */
  readonly n: string;

  /**
   * RSA Public Exponent.
   */
  readonly e: string;

  /**
   * RSA Private Exponent.
   */
  readonly d?: string;

  /**
   * RSA First Prime Factor.
   */
  readonly p?: string;

  /**
   * RSA Second Prime Factor.
   */
  readonly q?: string;

  /**
   * RSA First Factor CRT Exponent.
   */
  readonly dp?: string;

  /**
   * RSA Second Factor CRT Exponent.
   */
  readonly dq?: string;

  /**
   * RSA First Factor CRT Coefficient.
   */
  readonly qi?: string;
}
