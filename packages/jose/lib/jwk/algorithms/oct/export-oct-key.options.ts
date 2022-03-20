import { ExportOctKeyEncoding } from './types';

/**
 * Options for exporting the data of an OctKey.
 */
export interface ExportOctKeyOptions<T extends ExportOctKeyEncoding> {
  /**
   * Encoding of the exported OctKey.
   */
  readonly encoding: T;
}
