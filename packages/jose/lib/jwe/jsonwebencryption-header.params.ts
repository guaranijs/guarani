import { Optional } from '@guarani/types';

import { JsonWebKeyParams } from '../jwk/jsonwebkey.params';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from './algorithm/alg/supported-jsonwebencryption-keyencryption-algorithm';
import { SupportedJsonWebEncryptionContentEncryptionAlgorithm } from './algorithm/enc/supported-jsonwebencryption-contentencryption-algorithm';
import { SupportedJsonWebEncryptionCompressionAlgorithm } from './algorithm/zip/supported-jsonwebencryption-compression-algorithm';

export interface JsonWebEncryptionHeaderParams {
  /**
   * JSON Web Encryption Key Wrap Algorithm used to Wrap and Unwrap the Content Encryption Key.
   */
  readonly alg: SupportedJsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to Encrypt and Decrypt the Payload of the Token.
   */
  readonly enc: SupportedJsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Encryption Compression Algorithm used to Compress and Decompress the Plaintext Content of the Token.
   */
  readonly zip?: Optional<SupportedJsonWebEncryptionCompressionAlgorithm>;

  /**
   * URI of a Set of Public JSON Web Keys that contains the JSON Web Key used to Sign the Token.
   */
  readonly jku?: Optional<string>;

  /**
   * JSON Web Key used to Sign the Token.
   */
  readonly jwk?: Optional<JsonWebKeyParams>;

  /**
   * Identifier of the JSON Web Key used to Sign the Token.
   */
  readonly kid?: Optional<string>;

  /**
   * URI of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  readonly x5u?: Optional<string>;

  /**
   * Chain of X.509 certificates of the JSON Web Key used to Sign the Token.
   */
  readonly x5c?: Optional<string[]>;

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  readonly x5t?: Optional<string>;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key used to Sign the Token.
   */
  readonly 'x5t#S256'?: Optional<string>;

  /**
   * Defines the type of the Token.
   */
  readonly typ?: Optional<string>;

  /**
   * Defines the type of the Payload of the Token.
   */
  readonly cty?: Optional<string>;

  /**
   * Defines the parameters that MUST be present in the JOSE Header.
   */
  readonly crit?: Optional<string[]>;

  /**
   * Additional optional parameters.
   */
  readonly [parameter: string]: any;
}
