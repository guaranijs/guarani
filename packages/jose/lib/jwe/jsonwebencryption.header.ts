import { Optional } from '@guarani/types';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JoseHeader } from '../jose.header';
import { JsonWebKeyParams } from '../jwk/jsonwebkey.params';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from './algorithms/alg/supported-jsonwebencryption-keyencryption-algorithm';
import { JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY } from './algorithms/alg/jsonwebencryption-keywrap-algorithms-registry';
import { JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY } from './algorithms/enc/jsonwebencryption-contentencryption-algorithms-registry';
import { SupportedJsonWebEncryptionContentEncryptionAlgorithm } from './algorithms/enc/supported-jsonwebencryption-contentencryption-algorithm';
import { JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY } from './algorithms/zip/jsonwebencryption-compression-algorithms-registry';
import { SupportedJsonWebEncryptionCompressionAlgorithm } from './algorithms/zip/supported-jsonwebencryption-compression-algorithm';
import { JsonWebEncryptionHeaderParams } from './jsonwebencryption-header.params';

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc7516.html#section-4 RFC 7516 Section 4}.
 */
export class JsonWebEncryptionHeader extends JoseHeader implements JsonWebEncryptionHeaderParams {
  /**
   * JSON Web Encryption Key Wrap Algorithm used to Wrap and Unwrap the Content Encryption Key.
   */
  public readonly alg!: SupportedJsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to Encrypt and Decrypt the Plaintext of the Token.
   */
  public readonly enc!: SupportedJsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Encryption Compression Algorithm used to Compress and Decompress the Plaintext of the Token.
   */
  public readonly zip?: Optional<SupportedJsonWebEncryptionCompressionAlgorithm>;

  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key used to Encrypt the Token.
   */
  public readonly jku?: Optional<string>;

  /**
   * JSON Web Key used to Encrypt the Token.
   */
  public readonly jwk?: Optional<JsonWebKeyParams>;

  /**
   * Identifier of the JSON Web Key used to Encrypt the Token.
   */
  public readonly kid?: Optional<string>;

  /**
   * URI of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  public readonly x5u?: Optional<string>;

  /**
   * Chain of X.509 certificates of the JSON Web Key used to Encrypt the Token.
   */
  public readonly x5c?: Optional<string[]>;

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  public readonly x5t?: Optional<string>;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  public readonly 'x5t#S256'?: Optional<string>;

  /**
   * Defines the type of the Token.
   */
  public readonly typ?: Optional<string>;

  /**
   * Defines the type of the Payload of the Token.
   */
  public readonly cty?: Optional<string>;

  /**
   * Defines the parameters that MUST be present in the JSON Web Encryption Header.
   */
  public readonly crit?: Optional<string[]>;

  /**
   * Instantiates a JSON Web Encryption Header for Compact Serialization.
   *
   * @param params Parameters of the JSON Web Encryption Header.
   */
  public constructor(params: JsonWebEncryptionHeaderParams) {
    if (params instanceof JsonWebEncryptionHeader) {
      return params;
    }

    if (typeof params.alg !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "alg".');
    }

    if (typeof params.enc !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "enc".');
    }

    if (params.zip !== undefined && typeof params.zip !== 'string') {
      throw new InvalidJoseHeaderException('Invalid parameter "zip".');
    }

    if (JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY[params.alg] === undefined) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Encryption Key Wrap Algorithm "${params.alg}".`);
    }

    if (JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY[params.enc] === undefined) {
      throw new UnsupportedAlgorithmException(
        `Unsupported JSON Web Encryption Content Encryption Algorithm "${params.alg}".`
      );
    }

    if (params.zip !== undefined) {
      if (JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY[params.zip] === undefined) {
        throw new UnsupportedAlgorithmException(
          `Unsupported JSON Web Encryption Compression Algorithm "${params.zip}".`
        );
      }
    }

    super(params);
  }

  /**
   * Checks if the provided object conforms to the JSON Web Encryption Header Specification.
   *
   * @param data Object to be inspected.
   */
  public static isJsonWebEncryptionHeader(data: unknown): data is JsonWebEncryptionHeaderParams {
    const algs = Object.keys(JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY);
    const encs = Object.keys(JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY);

    const hasAlg = algs.includes((<JsonWebEncryptionHeaderParams>data).alg);
    const hasEnc = encs.includes((<JsonWebEncryptionHeaderParams>data).enc);

    return hasAlg && hasEnc;
  }
}
