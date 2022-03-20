import { Optional } from '@guarani/types';

import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from '../jwe/algorithms/alg/types/supported-jsonwebencryption-keyencryption-algorithm';
import { SupportedJsonWebSignatureAlgorithm } from '../jws/algorithms/types/supported-jsonwebsignature-algorithm';
import { SupportedJsonWebKeyAlgorithm } from './algorithms/types/supported-jsonwebkey-algorithm';
import { PublicKeyUse } from './types/public-key-use';
import { KeyOperation } from './types/key-operation';

/**
 * Parameters of the JSON Web Key.
 */
export interface JsonWebKeyParams {
  /**
   * Type of the JSON Web Key.
   */
  readonly kty?: Optional<SupportedJsonWebKeyAlgorithm>;

  /**
   * Indicates whether a Public JSON Web Key is used for Plaintext Encryption or Signature Verification.
   */
  readonly use?: Optional<PublicKeyUse>;

  /**
   * Operations for which the JSON Web Key are intended to be used.
   */
  readonly key_ops?: Optional<KeyOperation[]>;

  /**
   * Defines the JSON Web Encryption Key Wrap Algorithm or JSON Web Signature Algorithm
   * allowed to use this JSON Web Key.
   */
  readonly alg?: Optional<SupportedJsonWebEncryptionKeyWrapAlgorithm | SupportedJsonWebSignatureAlgorithm>;

  /**
   * Defines the Identifier of the JSON Web Key.
   */
  readonly kid?: Optional<string>;

  /**
   * Defines the URL of the X.509 certificate of the JSON Web Key.
   */
  readonly x5u?: Optional<string>;

  /**
   * Defines a chain of X.509 certificates of the JSON Web Key.
   */
  readonly x5c?: Optional<string[]>;

  /**
   * Defines the SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  readonly x5t?: Optional<string>;

  /**
   * Defines the SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  readonly 'x5t#S256'?: Optional<string>;

  /**
   * Additional custom parameters.
   */
  readonly [parameter: string]: any;
}
