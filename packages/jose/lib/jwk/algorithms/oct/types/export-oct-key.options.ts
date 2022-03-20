import { ExportOctKeyEncoding } from './export-oct-key-encoding';

/**
 * Options for Exporting an Octet Sequence JSON Web Key.
 */
export interface ExportOctKeyOptions<T extends ExportOctKeyEncoding> {
  /**
   * Encoding of the exported data.
   */
  readonly encoding: T;
}
