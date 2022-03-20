import { removeNullishValues } from '@guarani/objects';
import { Optional } from '@guarani/types';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY } from './algorithm/zip/jsonwebencryption-compression-algorithms-registry';
import { JsonWebEncryptionCompressionAlgorithm } from './algorithm/zip/jsonwebencryption-compression.algorithm';
import { JsonWebEncryptionHeaderParams } from './jsonwebencryption-header.params';
import { SupportedJsonWebEncryptionCompressionAlgorithm } from './supported-jsonwebencryption-compression-algorithm';
import { SupportedJsonWebEncryptionContentEncryptionAlgorithm } from './supported-jsonwebencryption-contentencryption-algorithm';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from './supported-jsonwebencryption-keyencryption-algorithm';

/**
 * Implementation of RFC 7516.
 *
 * This is the implementation of the Header of the Json Web Encryption.
 * It provides validation for the default parameters of the JOSE header.
 *
 * The JOSE Header is a JSON object that provides information on how to
 * manipulate the plaintext of the message, such as permitted algorithms
 * and the keys to be used in encrypting and decrypting the plaintext.
 */
export class JsonWebEncryptionHeader implements JsonWebEncryptionHeaderParams {
  /**
   * JSON Web Encryption Compression instance.
   */
  public readonly compressionAlgorithm!: JsonWebEncryptionCompressionAlgorithm;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to Wrap and Unwrap the Content Encryption Key.
   */
  public readonly alg!: SupportedJsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to Encrypt and Decrypt the Payload of the Token.
   */
  public readonly enc!: SupportedJsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Encryption Compression Algorithm used to Compress and Decompress the Plaintext Content of the Token.
   */
  public readonly zip?: Optional<SupportedJsonWebEncryptionCompressionAlgorithm>;

  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key used to Encrypt the Token.
   */
  public readonly jku?: Optional<string>;

  /**
   * JSON Web Key used to Encrypt the Token.
   */
  public readonly jwk?: Optional<JsonWebKey>;

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
   * Defines the parameters that MUST be present in the JOSE Header.
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

    let compressionAlgorithm: Optional<JsonWebEncryptionCompressionAlgorithm>;

    if (params.zip !== undefined) {
      compressionAlgorithm = JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY[params.zip];

      if (compressionAlgorithm === undefined) {
        throw new UnsupportedAlgorithmException(
          `Unsupported JSON Web Encryption Compression Algorithm "${params.zip}".`
        );
      }
    }

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

    Object.assign<JsonWebEncryptionHeader, JsonWebEncryptionHeaderParams>(this, removeNullishValues(params));

    Object.defineProperty(this, 'compressionAlgorithm', { enumerable: false, value: compressionAlgorithm });
  }
}
