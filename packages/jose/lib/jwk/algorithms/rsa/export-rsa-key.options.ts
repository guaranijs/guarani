import { ExportRsaKeyEncoding, ExportRsaKeyFormat, ExportRsaKeyType } from './types';

/**
 * Options for exporting an RSA Key.
 */
export interface ExportRsaKeyOptions<
  E extends ExportRsaKeyEncoding,
  F extends ExportRsaKeyFormat,
  T extends ExportRsaKeyType
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
