import { fromBuffer, toBuffer } from './primitives'

/**
 * Encodes a Buffer object into a Base64Url string.
 *
 * @param data Buffer to be encoded in Base64Url.
 * @returns Encoded Base64Url string.
 */
export function base64UrlEncode(data: Buffer): string {
  if (!Buffer.isBuffer(data)) {
    throw new TypeError('Invalid parameter "data".')
  }

  return data
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Decodes a Base64Url string back into a Buffer object.
 *
 * @param data Data to be decoded.
 * @returns Decoded buffer object.
 */
export function base64UrlDecode(data: string): Buffer {
  if (typeof data !== 'string') {
    throw new TypeError('Invalid parameter "data".')
  }

  const newData = data
    .concat('='.repeat(data.length % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  return Buffer.from(newData, 'base64')
}

/**
 * Encodes an integer into a Base64Url string.
 *
 * @param integer Integer to be encoded.
 * @returns Encoded Base64Url string.
 */
export function base64UrlEncodeInt(integer: number | bigint): string {
  return base64UrlEncode(toBuffer(BigInt(integer)))
}

/**
 * Decodes a Base64Url string into a bigint.
 *
 * @param data Data to be decoded.
 * @returns Decoded integer.
 */
export function base64UrlDecodeInt(data: string): bigint {
  return fromBuffer(base64UrlDecode(data), 'integer')
}

/**
 * Transforms a Base64 string into a Base64Url string.
 *
 * @param data Base64 string to be transformed.
 * @returns Base64Url string.
 */
export function base64toBase64Url(data: string): string {
  return base64UrlEncode(Buffer.from(data, 'base64'))
}

/**
 * Transforms a Base64Url string into a Base64 string.
 *
 * @param data Base64Url string to be transformed.
 * @returns Base64 string.
 */
export function base64UrltoBase64(data: string): string {
  return base64UrlDecode(data).toString('base64')
}

/**
 * Returns the length of the Buffer version of a Base64Url string.
 *
 * @param data Base64Url string to be analyzed.
 * @returns Length of the Buffer version of the Base64Url string.
 */
export function base64UrlBufferLength(data: string): number {
  return base64UrlDecode(data).length
}
