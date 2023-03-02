import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JoseHeader } from '../jose/jose.header';
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
export class JsonWebEncryptionHeader extends JoseHeader implements JsonWebEncryptionHeaderParameters {
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
    super(parameters);

    this.#keyWrapBackend = JSONWEBENCRYPTION_KEYWRAP_REGISTRY[parameters.alg];
    this.#contentEncryptionBackend = JSONWEBENCRYPTION_CONTENT_ENCRYPTION_REGISTRY[parameters.enc];

    if (parameters.zip !== undefined) {
      this.#compressionBackend = JSONWEBENCRYPTION_COMPRESSION_REGISTRY[parameters.zip];
    }
  }

  /**
   * Validates the provided JSON Web Encryption Header Parameters.
   *
   * @param parameters Parameters of the JSON Web Encryption Header.
   */
  protected override validateParameters(parameters: JsonWebEncryptionHeaderParameters): void {
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

    super.validateParameters(parameters);
  }
}
