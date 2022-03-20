/**
 * Supported JSON Web Key Algorithm.
 */
export type SupportedJsonWebKeyAlgorithm = 'EC' | 'RSA' | 'oct';

/**
 * Options for generating a JSON Web Key.
 */
export interface GenerateJsonWebKeyOptions {
  /**
   * JSON Web Key Algorithm.
   */
  readonly kty: SupportedJsonWebKeyAlgorithm;
}

/**
 * Options for exporting a JSON Web Key.
 */
export interface ExportJsonWebKeyOptions {
  /**
   * JSON Web Key Algorithm.
   */
  readonly kty: SupportedJsonWebKeyAlgorithm;
}
