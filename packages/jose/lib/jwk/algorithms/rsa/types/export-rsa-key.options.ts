import { ExportRsaKeyEncoding } from './export-rsa-key-encoding';
import { ExportRsaKeyFormat } from './export-rsa-key-format';
import { ExportRsaKeyType } from './export-rsa-key-type';

/**
 * Options for exporting an RSA JSON Web Key.
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
