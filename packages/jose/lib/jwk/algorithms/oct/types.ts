/**
 * OctKey export encodings supported by Guarani.
 */
export type ExportOctKeyEncoding = globalThis.BufferEncoding | 'buffer';

/**
 * OctKey export encodings supported by Guarani.
 */
export const SUPPORTED_OCTKEY_ENCODINGS: ExportOctKeyEncoding[] = [
  'ascii',
  'base64',
  'base64url',
  'binary',
  'buffer',
  'hex',
  'latin1',
  'ucs-2',
  'ucs2',
  'utf-8',
  'utf16le',
  'utf8',
];
