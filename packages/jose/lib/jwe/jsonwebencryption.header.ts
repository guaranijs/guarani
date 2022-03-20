import { Optional } from '@guarani/types';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JoseHeader } from '../jose.header';
import { JsonWebKeyParams } from '../jwk/jsonwebkey.params';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from './algorithm/alg/supported-jsonwebencryption-keyencryption-algorithm';
import { JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY } from './algorithm/alg/jsonwebencryption-keywrap-algorithms-registry';
import { JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY } from './algorithm/enc/jsonwebencryption-contentencryption-algorithms-registry';
import { SupportedJsonWebEncryptionContentEncryptionAlgorithm } from './algorithm/enc/supported-jsonwebencryption-contentencryption-algorithm';
import { JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY } from './algorithm/zip/jsonwebencryption-compression-algorithms-registry';
import { SupportedJsonWebEncryptionCompressionAlgorithm } from './algorithm/zip/supported-jsonwebencryption-compression-algorithm';
import { JsonWebEncryptionHeaderParams } from './jsonwebencryption-header.params';

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
export class JsonWebEncryptionHeader extends JoseHeader implements JsonWebEncryptionHeaderParams {
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
   * Checks if the provided object conforms to the JSON Web Encryption Header signature.
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
