import { JsonWebKeyParameters } from '../jwk/jsonwebkey.parameters';
import { JsonWebEncryptionCompressionAlgorithm } from './jsonwebencryption-compression-algorithm.enum';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './jsonwebencryption-content-encryption-algorithm.enum';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap-algorithm.enum';

/**
 * Parameters of the JSON Web Encryption Header.
 */
export interface JsonWebEncryptionHeaderParameters extends Record<string, unknown> {
  /**
   * JSON Web Encryption Key Wrap Algorithm used to Wrap and Unwrap the Content Encryption Key.
   */
  readonly alg: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to Encrypt and Decrypt the Plaintext of the Token.
   */
  readonly enc: JsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Encryption Compression Algorithm used to Compress and Decompress the Plaintext of the Token.
   */
  readonly zip?: JsonWebEncryptionCompressionAlgorithm;

  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key used to Encrypt the Token.
   */
  readonly jku?: string;

  /**
   * JSON Web Key used to Encrypt the Token.
   */
  readonly jwk?: JsonWebKeyParameters;

  /**
   * Identifier of the JSON Web Key used to Encrypt the Token.
   */
  readonly kid?: string;

  /**
   * URI of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  readonly x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key used to Encrypt the Token.
   */
  readonly x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  readonly x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used to Encrypt the Token.
   */
  readonly 'x5t#S256'?: string;

  /**
   * Defines the type of the Token.
   */
  readonly typ?: string;

  /**
   * Defines the type of the Payload of the Token.
   */
  readonly cty?: string;

  /**
   * Defines the parameters that MUST be present in the JSON Web Encryption Header.
   */
  readonly crit?: string[];
}