import { Dictionary } from '@guarani/types';

import { JsonWebKeyParameters } from '../jwk/jsonwebkey.parameters';

/**
 * Parameters of the generic JOSE Header.
 */
export interface JoseHeaderParameters extends Dictionary<any> {
  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key.
   */
  jku?: string;

  /**
   * Parameters of the JSON Web Key.
   */
  jwk?: JsonWebKeyParameters;

  /**
   * Identifier of the JSON Web Key.
   */
  kid?: string;

  /**
   * URI of the X.509 certificate of the JSON Web Key.
   */
  x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key.
   */
  x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key.
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
   * Defines the parameters that must be present in the JOSE Header.
   */
  crit?: string[];
}
