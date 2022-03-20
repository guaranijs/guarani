import { readFileSync } from 'fs';
import { join } from 'path';

import { RsaKeyParams } from '../../../lib/jwk/algorithms/rsa/rsa-key.params';
import { ExportRsaKeyFormat } from '../../../lib/jwk/algorithms/rsa/types/export-rsa-key-format';
import { ExportRsaKeyType } from '../../../lib/jwk/algorithms/rsa/types/export-rsa-key-type';

/**
 * Returns the DER Encoded RSA Key.
 */
export function loadDerRsaKey(format: ExportRsaKeyFormat, type: ExportRsaKeyType): Buffer {
  return readFileSync(join(__dirname, `rsa_${format}_${type}_key.bin`));
}

/**
 * Returns the PEM Encoded RSA Key.
 */
export function loadPemRsaKey(format: ExportRsaKeyFormat, type: ExportRsaKeyType): string {
  return readFileSync(join(__dirname, `rsa_${format}_${type}_key.pem`), { encoding: 'utf8' });
}

/**
 * Returns the Parameters of the RSA Key.
 */
export function loadJwkRsaKey(type: ExportRsaKeyType): RsaKeyParams {
  const jsonString = readFileSync(join(__dirname, `rsa_${type}_key.json`), { encoding: 'utf8' });
  return <RsaKeyParams>JSON.parse(jsonString);
}
