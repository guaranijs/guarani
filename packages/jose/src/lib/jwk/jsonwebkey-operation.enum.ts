/**
 * JSON Web Key Operations supported by Guarani.
 */
export enum JsonWebKeyOperation {
  /**
   * JSON Web Key Sign Operation.
   */
  Sign = 'sign',

  /**
   * JSON Web Key Verify Operation.
   */
  Verify = 'verify',

  /**
   * JSON Web Key Encrypt Operation.
   */
  Encrypt = 'encrypt',

  /**
   * JSON Web Key Decrypt Operation.
   */
  Decrypt = 'decrypt',

  /**
   * JSON Web Key Wrap Key Operation.
   */
  WrapKey = 'wrapKey',

  /**
   * JSON Web Key Unwrap Key Operation.
   */
  UnwrapKey = 'unwrapKey',

  /**
   * JSON Web Key Derive Bits Operation.
   */
  DeriveBits = 'deriveBits',

  /**
   * JSON Web Key Derive Key Operation.
   */
  DeriveKey = 'deriveKey',
}
