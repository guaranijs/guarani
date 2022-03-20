import { OctKey } from './oct.key';

/**
 * Exports the provided OctKey into a Base64 Encoded String.
 *
 * @param key OctKey to be exported.
 * @param format Format of the exported secret.
 * @returns Base64 encoded secret.
 */
export function exportOctKey(key: OctKey, format: 'base64'): string;

/**
 * Exports the provided OctKey into a Buffer object.
 *
 * @param key OctKey to be exported.
 * @param format Format of the exported secret.
 * @returns Binary encoded secret.
 */
export function exportOctKey(key: OctKey, format: 'binary'): Buffer;

/**
 * Exports the provided OctKey into one of the accepted formats.
 *
 * @param key OctKey to be exported.
 * @param format Format of the exported secret.
 * @returns Result of the exportation.
 */
export function exportOctKey(key: OctKey, format: 'base64' | 'binary'): string | Buffer {
  if (!(key instanceof OctKey)) {
    throw new TypeError('Invalid parameter "key".');
  }

  if (format !== 'base64' && format !== 'binary') {
    throw new Error('Invalid parameter "format".');
  }

  const secret = Buffer.from(key.k, 'base64url');

  return format === 'base64' ? secret.toString('base64') : secret;
}
