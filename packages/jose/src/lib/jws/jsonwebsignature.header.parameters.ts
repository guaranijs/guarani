import { JsonWebKeyParameters } from '../jwk/jsonwebkey.parameters';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature-algorithm.type';

/**
 * Parameters of the JSON Web Signature Header.
 */
export interface JsonWebSignatureHeaderParameters extends Record<string, any> {
  /**
   * JSON Web Signature Algorithm used to Sign and Verify the Token.
   */
  readonly alg: JsonWebSignatureAlgorithm;

  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key used to Sign the Token.
   */
  jku?: string;

  /**
   * JSON Web Key used to Sign the Token.
   */
  jwk?: JsonWebKeyParameters;

  /**
   * Identifier of the JSON Web Key used to Sign the Token.
   */
  kid?: string;

  /**
   * URI of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key used to Sign the Token.
   */
  x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  'x5t#S256'?: string;

  /**
   * Defines the type of the Token.
   */
  typ?: string;

  /**
   * Defines the type of the Payload of the Token.
   */
  cty?: string;

  /**
   * Defines the parameters that MUST be present in the JOSE Header.
   */
  crit?: string[];
}
