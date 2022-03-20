import { removeNullishValues } from '@guarani/objects';
import { Optional } from '@guarani/types';

import { InvalidJoseHeaderException } from './exceptions/invalid-jose-header.exception';
import { JoseHeaderParams } from './jose-header.params';
import { JsonWebKeyParams } from './jwk/jsonwebkey.params';

export abstract class JoseHeader implements JoseHeaderParams {
  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key.
   */
  public readonly jku?: Optional<string>;

  /**
   * JSON Web Key.
   */
  public readonly jwk?: Optional<JsonWebKeyParams>;

  /**
   * Identifier of the JSON Web Key.
   */
  public readonly kid?: Optional<string>;

  /**
   * URI of the X.509 certificate of the JSON Web Key.
   */
  public readonly x5u?: Optional<string>;

  /**
   * Chain of X.509 certificates of the JSON Web Key.
   */
  public readonly x5c?: Optional<string[]>;

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  public readonly x5t?: Optional<string>;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  public readonly 'x5t#S256'?: Optional<string>;

  /**
   * Defines the type of the Token.
   */
  public readonly typ?: Optional<string>;

  /**
   * Defines the type of the Payload or Plaintext of the Token.
   */
  public readonly cty?: Optional<string>;

  /**
   * Defines the parameters that MUST be present in the JOSE Header.
   */
  public readonly crit?: Optional<string[]>;

  /**
   * Instantiates a new JOSE Header.
   *
   * @param params Parameters of the JOSE Header.
   */
  public constructor(params: JoseHeaderParams) {
    if (params.jku !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "jku".');
    }

    if (params.jwk !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "jwk".');
    }

    if (params.kid !== undefined && typeof params.kid !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "kid".');
    }

    if (params.x5u !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5u".');
    }

    if (params.x5c !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5c".');
    }

    if (params.x5t !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5t".');
    }

    if (params['x5t#S256'] !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported parameter "x5t#S256".');
    }

    if (params.crit !== undefined) {
      if (!Array.isArray(params.crit) || params.crit.length === 0) {
        throw new InvalidJoseHeaderException('Invalid parameter "crit".');
      }

      if (params.crit.some((criticalParam) => typeof criticalParam !== 'string' || criticalParam.length === 0)) {
        throw new InvalidJoseHeaderException('Invalid parameter "crit".');
      }

      params.crit.forEach((criticalParam) => {
        if (params[criticalParam] === undefined) {
          throw new InvalidJoseHeaderException(`Missing required parameter "${criticalParam}".`);
        }
      });
    }

    Object.assign<JoseHeader, JoseHeaderParams>(this, removeNullishValues(params));
  }
}
