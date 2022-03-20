import { readFileSync } from 'fs';
import { join } from 'path';

import { EcKeyParams } from '../../../lib/jwk/algorithms/ec/ec-key.params';
import { ExportEcKeyFormat } from '../../../lib/jwk/algorithms/ec/types/export-ec-key-format';
import { ExportEcKeyType } from '../../../lib/jwk/algorithms/ec/types/export-ec-key-type';

/**
 * Returns the DER Encoded Elliptic Curve Key.
 */
export function loadDerEllipticCurveKey(format: ExportEcKeyFormat, type: ExportEcKeyType): Buffer {
  return readFileSync(join(__dirname, `ec_${format}_${type}_key.bin`));
}

/**
 * Returns the PEM Encoded Elliptic Curve Key.
 */
export function loadPemEllipticCurveKey(format: ExportEcKeyFormat, type: ExportEcKeyType): string {
  return readFileSync(join(__dirname, `ec_${format}_${type}_key.pem`), { encoding: 'utf8' });
}

/**
 * Returns the Parameters of the Elliptic Curve Key.
 */
export function loadJwkEllipticCurveKey(type: ExportEcKeyType): EcKeyParams {
  const jsonString = readFileSync(join(__dirname, `ec_${type}_key.json`), { encoding: 'utf8' });
  return <EcKeyParams>JSON.parse(jsonString);
}
