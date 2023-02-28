import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebEncryptionKeyWrapBackend } from './backends/alg/jsonwebencryption-keywrap.backend';
import { JSONWEBENCRYPTION_KEYWRAP_REGISTRY } from './backends/alg/jsonwebencryption-keywrap.registry';
import { JsonWebEncryptionContentEncryptionBackend } from './backends/enc/jsonwebencryption-content-encryption.backend';
import { JSONWEBENCRYPTION_CONTENT_ENCRYPTION_REGISTRY } from './backends/enc/jsonwebencryption-content-encryption.registry';
import { JsonWebEncryptionCompressionBackend } from './backends/zip/jsonwebencryption-compression.backend';
import { JSONWEBENCRYPTION_COMPRESSION_REGISTRY } from './backends/zip/jsonwebencryption-compression.registry';
import { JsonWebEncryptionCompressionAlgorithm } from './jsonwebencryption-compression-algorithm.type';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './jsonwebencryption-content-encryption-algorithm.type';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap-algorithm.type';
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
  public jku?: string;

  /**
   * JSON Web Key used to Encrypt the Token.
   */
  public jwk?: JsonWebKey;

  /**
   * Identifier of the JSON Web Key used to Encrypt the Token.
   */
  public kid?: string;

  /**
   * URI of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  public x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key used to Encrypt the Token.
   */
  public x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  public x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
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
   * Defines the parameters that MUST be present in the JSON Web Encryption Header.
   */
  public crit?: string[];

  /**
   * Additional JSON Web Encryption Header Parameters.
   */
  [parameter: string]: any;

  /**
   * JSON Web Encryption Key Wrap Backend.
   */
  readonly #keyWrapBackend!: JsonWebEncryptionKeyWrapBackend;

  /**
   * JSON Web Encryption Content Encryption Backend.
   */
  readonly #contentEncryptionBackend!: JsonWebEncryptionContentEncryptionBackend;

  /**
   * JSON Web Encryption Compression Backend.
   */
  readonly #compressionBackend?: JsonWebEncryptionCompressionBackend;

  /**
   * JSON Web Encryption Key Wrap Backend.
   */
  public get keyWrapBackend(): JsonWebEncryptionKeyWrapBackend {
    return this.#keyWrapBackend;
  }

  /**
   * JSON Web Encryption Content Encryption Backend.
   */
  public get contentEncryptionBackend(): JsonWebEncryptionContentEncryptionBackend {
    return this.#contentEncryptionBackend;
  }

  /**
   * JSON Web Encryption Compression Backend.
   */
  public get compressionBackend(): JsonWebEncryptionCompressionBackend | undefined {
    return this.#compressionBackend;
  }

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

    this.#keyWrapBackend = JSONWEBENCRYPTION_KEYWRAP_REGISTRY[parameters.alg];
    this.#contentEncryptionBackend = JSONWEBENCRYPTION_CONTENT_ENCRYPTION_REGISTRY[parameters.enc];

    if (parameters.zip !== undefined) {
      this.#compressionBackend = JSONWEBENCRYPTION_COMPRESSION_REGISTRY[parameters.zip];
    }

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

    if (!Object.hasOwn(JSONWEBENCRYPTION_KEYWRAP_REGISTRY, parameters.alg)) {
      throw new UnsupportedAlgorithmException(
        `Unsupported JSON Web Encryption Key Wrap Algorithm "${parameters.alg}".`
      );
    }

    if (!Object.hasOwn(JSONWEBENCRYPTION_CONTENT_ENCRYPTION_REGISTRY, parameters.enc)) {
      throw new UnsupportedAlgorithmException(
        `Unsupported JSON Web Encryption Content Encryption Algorithm "${parameters.enc}".`
      );
    }

    if (parameters.zip !== undefined) {
      if (!Object.hasOwn(JSONWEBENCRYPTION_COMPRESSION_REGISTRY, parameters.zip)) {
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
