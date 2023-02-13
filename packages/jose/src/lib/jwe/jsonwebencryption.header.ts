import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { A128KW, A192KW, A256KW } from './backends/alg/aes.backend';
import { dir } from './backends/alg/dir.backend';
import { A128GCMKW, A192GCMKW, A256GCMKW } from './backends/alg/gcm.backend';
import { JsonWebEncryptionKeyWrapBackend } from './backends/alg/jsonwebencryption-keywrap.backend';
import { RSA1_5, RSA_OAEP, RSA_OAEP_256, RSA_OAEP_384, RSA_OAEP_512 } from './backends/alg/rsa.backend';
import { A128CBC_HS256, A192CBC_HS384, A256CBC_HS512 } from './backends/enc/cbc.backend';
import { A128GCM, A192GCM, A256GCM } from './backends/enc/gcm.backend';
import { JsonWebEncryptionContentEncryptionBackend } from './backends/enc/jsonwebencryption-content-encryption.backend';
import { DEF } from './backends/zip/def.backend';
import { JsonWebEncryptionCompressionBackend } from './backends/zip/jsonwebencryption-compression.backend';
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
   * JSON Web Encryption Key Wrap Backend.
   */
  public readonly keyWrapBackend!: JsonWebEncryptionKeyWrapBackend;

  /**
   * JSON Web Encryption Content Encryption Backend.
   */
  public readonly contentEncryptionBackend!: JsonWebEncryptionContentEncryptionBackend;

  /**
   * JSON Web Encryption Compression Backend.
   */
  public readonly compressionBackend?: JsonWebEncryptionCompressionBackend;

  /**
   * Supported JSON Web Encryption Key Wrap Backends.
   */
  private static readonly keyWrapBackends: Record<JsonWebEncryptionKeyWrapAlgorithm, JsonWebEncryptionKeyWrapBackend> =
    {
      A128GCMKW,
      A128KW,
      A192GCMKW,
      A192KW,
      A256GCMKW,
      A256KW,
      dir,
      RSA1_5,
      'RSA-OAEP': RSA_OAEP,
      'RSA-OAEP-256': RSA_OAEP_256,
      'RSA-OAEP-384': RSA_OAEP_384,
      'RSA-OAEP-512': RSA_OAEP_512,
    };

  /**
   * Supported JSON Web Encryption Content Encryption Backends.
   */
  private static readonly contentEncryptionBackends: Record<
    JsonWebEncryptionContentEncryptionAlgorithm,
    JsonWebEncryptionContentEncryptionBackend
  > = {
    'A128CBC-HS256': A128CBC_HS256,
    'A192CBC-HS384': A192CBC_HS384,
    'A256CBC-HS512': A256CBC_HS512,
    A128GCM,
    A192GCM,
    A256GCM,
  };

  /**
   * Supported JSON Web Encryption Compression Backends.
   */
  private static readonly compressionBackends: Record<
    JsonWebEncryptionCompressionAlgorithm,
    JsonWebEncryptionCompressionBackend
  > = {
    DEF,
  };

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

    Object.defineProperty(this, 'keyWrapBackend', { value: JsonWebEncryptionHeader.keyWrapBackends[parameters.alg] });

    Object.defineProperty(this, 'contentEncryptionBackend', {
      value: JsonWebEncryptionHeader.contentEncryptionBackends[parameters.enc],
    });

    if (parameters.zip !== undefined) {
      Object.defineProperty(this, 'compressionBackend', {
        value: JsonWebEncryptionHeader.compressionBackends[parameters.zip],
      });
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

    if (!Object.keys(this.keyWrapBackends).includes(parameters.alg)) {
      throw new UnsupportedAlgorithmException(
        `Unsupported JSON Web Encryption Key Wrap Algorithm "${parameters.alg}".`
      );
    }

    if (!Object.keys(this.contentEncryptionBackends).includes(parameters.enc)) {
      throw new UnsupportedAlgorithmException(
        `Unsupported JSON Web Encryption Content Encryption Algorithm "${parameters.enc}".`
      );
    }

    if (parameters.zip !== undefined) {
      if (!Object.keys(this.compressionBackends).includes(parameters.zip)) {
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
