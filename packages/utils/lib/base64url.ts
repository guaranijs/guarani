/**
 * Tools to work with Base64Url strings.
 *
 * @module Base64Url
 */

import { fromBuffer, toBuffer } from './primitives'

/**
 * Encodes a Buffer object into a Base64Url string.
 *
 * @param data - Buffer to be encoded in Base64Url.
 * @returns Encoded Base64Url string.
 */
export function encode(data: Buffer): string {
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
 * @param data - Data to be decoded.
 * @returns Decoded buffer object.
 */
export function decode(data: string): Buffer {
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
 * @param integer - Integer to be encoded.
 * @returns Encoded Base64Url string.
 */
export function encodeInt(integer: number | bigint): string {
  return encode(toBuffer(BigInt(integer)))
}

/**
 * Decodes a Base64Url string back into a bigint.
 *
 * @param data - Data to be decoded.
 * @returns Decoded integer.
 */
export function decodeInt(data: string): bigint {
  return fromBuffer(decode(data), 'integer')
}

/**
 * Transforms a Base64 string into a Base64Url string.
 *
 * @param data - Base64 string to be transformed.
 * @returns Base64Url string.
 */
export function fromBase64(data: string): string {
  return encode(Buffer.from(data, 'base64'))
}

/**
 * Transforms a Base64Url string into a Base64 string.
 *
 * @param data - Base64Url string to be transformed.
 * @returns Base64 string.
 */
export function toBase64(data: string): string {
  return decode(data).toString('base64')
}

/**
 * Returns the length of the Buffer version of a Base64Url string.
 *
 * @param data - Base64Url string to be analyzed.
 * @returns Length of the Buffer version of the Base64Url string.
 */
export function bufferLength(data: string): number {
  return decode(data).length
}
