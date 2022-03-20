import { readFileSync } from 'fs';
import { join } from 'path';

import { OctKeyParams } from '../../../lib/jwk/algorithms/oct/oct-key.params';

/**
 * Returns the Buffer Encoded Octet Sequence Key.
 */
export function loadBinaryOctetSequenceKey(): Buffer {
  return readFileSync(join(__dirname, `oct_secret_key.bin`));
}

/**
 * Returns the String Base64 Encoded Octet Sequence Key.
 */
export function loadStringOctetSequenceKey(): string {
  return readFileSync(join(__dirname, `oct_secret_key.pem`), { encoding: 'utf8' });
}

/**
 * Returns the Parameters of the Octet Sequence Key.
 */
export function loadJwkOctetSequenceKey(): OctKeyParams {
  const jsonString = readFileSync(join(__dirname, `oct_secret_key.json`), { encoding: 'utf8' });
  return <OctKeyParams>JSON.parse(jsonString);
}
