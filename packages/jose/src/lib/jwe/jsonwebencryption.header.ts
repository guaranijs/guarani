import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebEncryptionCompressionAlgorithm } from './jsonwebencryption-compression-algorithm.enum';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './jsonwebencryption-content-encryption-algorithm.enum';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap-algorithm.enum';
import { JsonWebEncryptionHeaderParameters } from './jsonwebencryption.header.parameters';

/**
 * Implementation of the JSON Web Encryption Header.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7516.html#section-4
 */
export class JsonWebEncryptionHeader implements JsonWebEncryptionHeaderParameters {
  /**
   * JSON Web Encryption Key Wrap Algorithm used to Wrap and Unwrap the Content Encryption Key.
   */
  public readonly alg!: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to Encrypt and Decrypt the Plaintext of the Token.
   */
  public readonly enc!: JsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Encryption Compression Algorithm used to Compress and Decompress the Plaintext of the Token.
   */
  public readonly zip?: JsonWebEncryptionCompressionAlgorithm;

  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key used to Encrypt the Token.
   */
  public readonly jku?: string;

  /**
   * JSON Web Key used to Encrypt the Token.
   */
  public readonly jwk?: JsonWebKey;

  /**
   * Identifier of the JSON Web Key used to Encrypt the Token.
   */
  public readonly kid?: string;

  /**
   * URI of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  public readonly x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key used to Encrypt the Token.
   */
  public readonly x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  public readonly x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
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
   * Defines the parameters that MUST be present in the JSON Web Encryption Header.
   */
  public readonly crit?: string[];

  /**
   * Additional JSON Web Encryption Header Parameters.
   */
  readonly [parameter: string]: unknown;

  /**
   * Instantiates a new JSON Web Encryption Header based on the provided Parameters.
   *
   * @param parameters JSON Web Encryption Header Parameters.
   */
  public constructor(parameters: JsonWebEncryptionHeaderParameters) {
    if (parameters instanceof JsonWebEncryptionHeader) {
      return parameters;
    }

    if (!JsonWebEncryptionHeader.checkIsJsonWebEncryptionHeader(parameters)) {
      throw new InvalidJoseHeaderException(
        'The provided parameters do not represent a valid JSON Web Encryption Header.'
      );
    }

    JsonWebEncryptionHeader.validateParameters(parameters);

    Object.assign(this, parameters);
  }

  /**
   * Checks if the provided JSON Web Encryption Header Parameters object is a valid Parameters object.
   *
   * @param parameters JSON Web Encryption Header Parameters object to be checked.
   */
  private static checkIsJsonWebEncryptionHeader(
    parameters: JsonWebEncryptionHeaderParameters
  ): parameters is JsonWebEncryptionHeaderParameters {
    return Object.hasOwn(parameters, 'alg') && Object.hasOwn(parameters, 'enc');
  }

  /**
   * Validates the provided JSON Web Signature Header Parameters.
   *
   * @param parameters Parameters of the JSON Web Signature Header.
   */
  private static validateParameters(parameters: JsonWebEncryptionHeaderParameters): void {
    if (typeof parameters.alg !== 'string') {
      throw new InvalidJoseHeaderException('Invalid header parameter "alg".');
    }

    if (typeof parameters.enc !== 'string') {
      throw new InvalidJoseHeaderException('Invalid header parameter "enc".');
    }

    if (parameters.zip !== undefined && typeof parameters.zip !== 'string') {
      throw new InvalidJoseHeaderException('Invalid header parameter "zip".');
    }

    if (!Object.values(JsonWebEncryptionKeyWrapAlgorithm).includes(parameters.alg)) {
      throw new UnsupportedAlgorithmException(
        `Unsupported JSON Web Encryption Key Wrap Algorithm "${parameters.alg}".`
      );
    }

    if (!Object.values(JsonWebEncryptionContentEncryptionAlgorithm).includes(parameters.enc)) {
      throw new UnsupportedAlgorithmException(
        `Unsupported JSON Web Encryption Content Encryption Algorithm "${parameters.enc}".`
      );
    }

    if (parameters.zip !== undefined) {
      if (!Object.values(JsonWebEncryptionCompressionAlgorithm).includes(parameters.zip)) {
        throw new UnsupportedAlgorithmException(
          `Unsupported JSON Web Encryption Compression Algorithm "${parameters.zip}".`
        );
      }
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
