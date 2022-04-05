import { ExportEcKeyEncoding } from './export-ec-key-encoding';
import { ExportEcKeyFormat } from './export-ec-key-format';
import { ExportEcKeyType } from './export-ec-key-type';

/**
 * Options for Exporting an Elliptic Curve JSON Web Key.
 */
export interface ExportEcKeyOptions<
  E extends ExportEcKeyEncoding,
  F extends ExportEcKeyFormat,
  T extends ExportEcKeyType
> {
  /**
   * Encoding of the exported data.
   */
  readonly encoding: E;

  /**
   * Protocol used to encode the data.
   */
  readonly format: F;

  /**
   * Type of the key to be exported.
   */
  readonly type: T;
}
