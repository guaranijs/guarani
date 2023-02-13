/**
 * JSON Web Key Operations supported by Guarani.
 */
export type JsonWebKeyOperation =
  | 'sign'
  | 'verify'
  | 'encrypt'
  | 'decrypt'
  | 'wrapKey'
  | 'unwrapKey'
  | 'deriveBits'
  | 'deriveKey';
