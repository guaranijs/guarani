import { Optional } from '@guarani/types';

import { JsonWebKeyParams } from './jwk/jsonwebkey.params';

export interface JoseHeaderParams {
  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key.
   */
  readonly jku?: Optional<string>;

  /**
   * JSON Web Key.
   */
  readonly jwk?: Optional<JsonWebKeyParams>;

  /**
   * Identifier of the JSON Web Key.
   */
  readonly kid?: Optional<string>;

  /**
   * URI of the X.509 certificate of the JSON Web Key.
   */
  readonly x5u?: Optional<string>;

  /**
   * Chain of X.509 certificates of the JSON Web Key.
   */
  readonly x5c?: Optional<string[]>;

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  readonly x5t?: Optional<string>;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  readonly 'x5t#S256'?: Optional<string>;

  /**
   * Defines the type of the Token.
   */
  readonly typ?: Optional<string>;

  /**
   * Defines the type of the Payload or Plaintext of the Token.
   */
  readonly cty?: Optional<string>;

  /**
   * Defines the parameters that MUST be present in the JOSE Header.
   */
  readonly crit?: Optional<string[]>;

  /**
   * Additional optional parameters.
   */
  readonly [parameter: string]: any;
}
