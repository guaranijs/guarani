import { JsonWebEncryptionKeyWrapAlgorithm } from '../jwe/jsonwebencryption-keywrap-algorithm.enum';
import { JsonWebSignatureAlgorithm } from '../jws/jsonwebsignature-algorithm.enum';
import { JsonWebKeyOperation } from './jsonwebkey-operation.enum';
import { JsonWebKeyType } from './jsonwebkey-type.enum';
import { JsonWebKeyUse } from './jsonwebkey-use.enum';

/**
 * Parameters of the JSON Web Key.
 */
export interface JsonWebKeyParameters extends Record<string, unknown> {
  /**
   * JSON Web Key Type.
   */
  readonly kty: JsonWebKeyType;

  /**
   * Indicates whether a Public JSON Web Key is used for Plaintext Encryption or Signature Verification.
   */
  readonly use?: JsonWebKeyUse;

  /**
   * Operations for which the JSON Web Key are intended to be used.
   */
  readonly key_ops?: JsonWebKeyOperation[];

  /**
   * JSON Web Encryption Key Wrap Algorithm or JSON Web Signature Algorithm allowed to use this JSON Web Key.
   */
  readonly alg?: JsonWebEncryptionKeyWrapAlgorithm | JsonWebSignatureAlgorithm;

  /**
   * Identifier of the JSON Web Key.
   */
  readonly kid?: string;

  /**
   * URL of the X.509 certificate of the JSON Web Key.
   */
  readonly x5u?: string;

  /**
   * Chain of X.509 certificates of the JSON Web Key.
   */
  readonly x5c?: string[];

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  readonly x5t?: string;

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the JSON Web Key.
   */
  readonly 'x5t#S256'?: string;
}