/**
 * Operation for which the JSON Web Key is intended to be used.
 */
export type KeyOperation =
  | 'sign'
  | 'verify'
  | 'encrypt'
  | 'decrypt'
  | 'wrapKey'
  | 'unwrapKey'
  | 'deriveKey'
  | 'deriveBits';
