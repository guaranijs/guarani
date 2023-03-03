import { removeUndefined } from '@guarani/primitives';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JoseHeaderParameters } from './jose.header.parameters';

/**
 * Implementation of the generic JOSE Header.
 */
export abstract class JoseHeader implements JoseHeaderParameters {
  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key used by the JOSE Header.
   */
  public jku?: string;

  /**
   * Parameters of the JSON Web Key used by the JOSE Header.
   */
  public jwk?: JsonWebKey;

  /**
   * Identifier of the JSON Web Key used by the JOSE Header.
   */
  public kid?: string;

  /**
   * URI of the X.509 certificate of the JSON Web Key used by the JOSE Header.
   */
  public x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key used by the JOSE Header.
   */
  public x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used by the JOSE Header.
   */
  public x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used by the JOSE Header.
   */
  public 'x5t#S256'?: string;

  /**
   * Defines the type of the Token.
   */
  public typ?: string;

  /**
   * Defines the type of the Payload of the Token.
   */
  public cty?: string;

  /**
   * Defines the parameters that MUST be present in the JOSE Header.
   */
  public crit?: string[];

  /**
   * Additional JOSE Header Parameters.
   */
  [parameter: string]: any;

  /**
   * Instantiates a new JOSE Header based on the provided Parameters.
   *
   * @param parameters JOSE Header Parameters.
   */
  public constructor(parameters: JoseHeaderParameters) {
    if (parameters instanceof JoseHeader) {
      return parameters;
    }

    this.validateParameters(parameters);

    Object.assign(this, removeUndefined<JoseHeaderParameters>(parameters));
  }

  /**
   * Validates the provided JOSE Header Parameters.
   *
   * @param parameters Parameters of the JOSE Header.
   */
  protected validateParameters(parameters: JoseHeaderParameters): void {
    if (parameters.jku !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported header parameter "jku".');
    }

    if (parameters.jwk !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported header parameter "jwk".');
    }

    if (parameters.kid !== undefined && typeof parameters.kid !== 'string') {
      throw new InvalidJoseHeaderException('Invalid header parameter "kid".');
    }

    if (parameters.x5u !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported header parameter "x5u".');
    }

    if (parameters.x5c !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported header parameter "x5c".');
    }

    if (parameters.x5t !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported header parameter "x5t".');
    }

    if (parameters['x5t#S256'] !== undefined) {
      throw new InvalidJoseHeaderException('Unsupported header parameter "x5t#S256".');
    }

    if (parameters.crit !== undefined) {
      if (!Array.isArray(parameters.crit) || parameters.crit.length === 0) {
        throw new InvalidJoseHeaderException('Invalid header parameter "crit".');
      }

      if (parameters.crit.some((parameter) => typeof parameter !== 'string' || parameter.length === 0)) {
        throw new InvalidJoseHeaderException('Invalid header parameter "crit".');
      }

      parameters.crit.forEach((parameter) => {
        if (!Object.hasOwn(parameters, parameter)) {
          throw new InvalidJoseHeaderException(`Missing required header parameter "${parameter}".`);
        }
      });
    }
  }
}
