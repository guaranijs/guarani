import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { ES256, ES384, ES512 } from './backends/ecdsa.backend';
import { HS256, HS384, HS512 } from './backends/hmac.backend';
import { JsonWebSignatureBackend } from './backends/jsonwebsignature.backend';
import { none } from './backends/none.backend';
import { PS256, PS384, PS512, RS256, RS384, RS512 } from './backends/rsassa.backend';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature-algorithm.type';
import { JsonWebSignatureHeaderParameters } from './jsonwebsignature.header.parameters';

/**
 * Implementation of the JSON Web Signature Header.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7515.html#section-4
 */
export class JsonWebSignatureHeader implements JsonWebSignatureHeaderParameters {
  /**
   * JSON Web Signature Algorithm used to Sign and Verify the Token.
   */
  public readonly alg!: JsonWebSignatureAlgorithm;

  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key used to Sign the Token.
   */
  public readonly jku?: string;

  /**
   * JSON Web Key used to Sign the Token.
   */
  public readonly jwk?: JsonWebKey;

  /**
   * Identifier of the JSON Web Key used to Sign the Token.
   */
  public readonly kid?: string;

  /**
   * URI of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  public readonly x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key used to Sign the Token.
   */
  public readonly x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  public readonly x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  public readonly 'x5t#S256'?: string;

  /**
   * Defines the type of the Token.
   */
  public readonly typ?: string;

  /**
   * Defines the type of the Payload of the Token.
   */
  public readonly cty?: string;

  /**
   * Defines the parameters that MUST be present in the JOSE Header.
   */
  public readonly crit?: string[];

  /**
   * Additional JSON Web Signature Header Parameters.
   */
  readonly [parameter: string]: unknown;

  /**
   * JSON Web Signature Backend.
   */
  public readonly backend!: JsonWebSignatureBackend;

  /**
   * Supported JSON Web Signature Backends.
   */
  private static readonly backends: Record<JsonWebSignatureAlgorithm, JsonWebSignatureBackend> = {
    ES256,
    ES384,
    ES512,
    HS256,
    HS384,
    HS512,
    none,
    PS256,
    PS384,
    PS512,
    RS256,
    RS384,
    RS512,
  };

  /**
   * Instantiates a new JSON Web Signature Header based on the provided Parameters.
   *
   * @param parameters JSON Web Signature Header Parameters.
   */
  public constructor(parameters: JsonWebSignatureHeaderParameters) {
    if (parameters instanceof JsonWebSignatureHeader) {
      return parameters;
    }

    if (!JsonWebSignatureHeader.checkIsJsonWebSignatureHeader(parameters)) {
      throw new InvalidJoseHeaderException(
        'The provided parameters do not represent a valid JSON Web Signature Header.'
      );
    }

    JsonWebSignatureHeader.validateParameters(parameters);

    Object.defineProperty(this, 'backend', { value: JsonWebSignatureHeader.backends[parameters.alg] });

    Object.assign(this, parameters);
  }

  /**
   * Checks if the provided JSON Web Signature Header Parameters object is a valid Parameters object.
   *
   * @param parameters JSON Web Signature Header Parameters object to be checked.
   */
  private static checkIsJsonWebSignatureHeader(
    parameters: JsonWebSignatureHeaderParameters
  ): parameters is JsonWebSignatureHeaderParameters {
    return Object.hasOwn(parameters, 'alg');
  }

  /**
   * Validates the provided JSON Web Signature Header Parameters.
   *
   * @param parameters Parameters of the JSON Web Signature Header.
   */
  private static validateParameters(parameters: JsonWebSignatureHeaderParameters): void {
    if (typeof parameters.alg !== 'string') {
      throw new InvalidJoseHeaderException('Invalid header parameter "alg".');
    }

    if (!Object.keys(this.backends).includes(parameters.alg)) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Signature Algorithm "${parameters.alg}".`);
    }

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
