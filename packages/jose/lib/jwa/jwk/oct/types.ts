import { ExportJsonWebKeyOptions, GenerateJsonWebKeyOptions } from '../types';

/**
 * Options for generating Octet JSON Web Keys.
 */
export interface GenerateOctKeyOptions extends GenerateJsonWebKeyOptions {
  /**
   * JSON Web Key Algorithm.
   */
  readonly kty: 'oct';

  /**
   * Size of the Secret in bytes.
   */
  readonly size: number;
}

/**
 * Octet JSON Web Key Export Format.
 */
type ExportOctKeyFormat = 'base64' | 'buffer';

/**
 * Options for exporting an Octet Key.
 */
export interface ExportOctKeyOptions<T extends ExportOctKeyFormat> extends ExportJsonWebKeyOptions {
  /**
   * JSON Web Key Algorithm.
   */
  readonly kty: 'oct';

  /**
   * Export Format.
   */
  readonly format: T;
}
