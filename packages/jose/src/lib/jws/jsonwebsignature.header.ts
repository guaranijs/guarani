import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebSignatureBackend } from './backends/jsonwebsignature.backend';
import { JSONWEBSIGNATURE_REGISTRY } from './backends/jsonwebsignature.registry';
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
  public jku?: string;

  /**
   * JSON Web Key used to Sign the Token.
   */
  public jwk?: JsonWebKey;

  /**
   * Identifier of the JSON Web Key used to Sign the Token.
   */
  public kid?: string;

  /**
   * URI of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  public x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key used to Sign the Token.
   */
  public x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  public x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
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
   * Additional JSON Web Signature Header Parameters.
   */
  [parameter: string]: any;

  /**
   * JSON Web Signature Backend.
   */
  readonly #backend!: JsonWebSignatureBackend;

  /**
   * JSON Web Signature Backend.
   */
  public get backend(): JsonWebSignatureBackend {
    return this.#backend;
  }

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

    this.#backend = JSONWEBSIGNATURE_REGISTRY[parameters.alg];

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

    if (!Object.hasOwn(JSONWEBSIGNATURE_REGISTRY, parameters.alg)) {
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
