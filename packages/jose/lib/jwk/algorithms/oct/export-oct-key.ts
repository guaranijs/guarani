import { decode } from '@guarani/base64url'

import { OctKey } from './oct.key'

/**
 * Exports the provided OctKey into a Buffer object.
 *
 * @param key OctKey to be exported.
 * @param format Format of the exported secret.
 * @returns Binary encoded secret.
 */
export function exportOctKey(key: OctKey, format: 'binary'): Buffer

/**
 * Exports the provided OctKey into a Base64 Encoded String.
 *
 * @param key OctKey to be exported.
 * @param format Format of the exported secret.
 * @returns Base64 encoded secret.
 */
export function exportOctKey(key: OctKey, format: 'base64'): string

/**
 * Exports the provided OctKey into one of the accepted formats.
 *
 * @param key OctKey to be exported.
 * @param format Format of the exported secret.
 * @returns Result of the exportation.
 */
export function exportOctKey(
  key: OctKey,
  format: 'binary' | 'base64'
): Buffer | string {
  if (!(key instanceof OctKey)) {
    throw new TypeError('Invalid parameter "key".')
  }

  if (format !== 'binary' && format !== 'base64') {
    throw new Error('Invalid parameter "format".')
  }

  return format === 'binary' ? decode(key.k, Buffer) : decode(key.k, String)
}
