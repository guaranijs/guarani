import { ExportEcKeyEncoding, ExportEcKeyFormat, ExportEcKeyType } from './types';

/**
 * Options for exporting an Elliptic Curve Key.
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
