import { JoseHeaderParameters } from '../jose/jose.header.parameters';
import { JsonWebEncryptionCompressionAlgorithm } from './jsonwebencryption-compression-algorithm.type';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './jsonwebencryption-content-encryption-algorithm.type';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap-algorithm.type';

/**
 * Parameters of the JSON Web Encryption Header.
 */
export interface JsonWebEncryptionHeaderParameters extends JoseHeaderParameters {
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
}
