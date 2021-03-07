import { fromBuffer, toBuffer } from './primitives'

/**
 * Encodes a Buffer object into a base64-url string.
 *
 * @param {Buffer} data Buffer to be encoded in base64-url.
 * @returns Encoded base64-url string.
 */
export function encode (data: Buffer): string {
  if (data == null) return null
  return data.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decodes a base64-url string back into a Buffer object.
 *
 * @param {string} data Data to be decoded.
 * @returns Decoded buffer object.
 */
export function decode (data: string): Buffer {
  if (data == null) return null
  const newData = data.concat('='.repeat(data.length % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(newData, 'base64')
}

/**
 * Encodes an integer into a base64-url string.
 *
 * @param {number | bigint} integer Integer to be encoded.
 * @returns Encoded base64-url string.
 */
export function encodeInt (integer: number | bigint): string {
  return encode(toBuffer(integer))
}

/**
 * Decodes a base64-url string back into a bigint.
 *
 * @param {string} data Data to be decoded.
 * @returns Decoded integer.
 */
export function decodeInt (data: string): bigint {
  return fromBuffer(decode(data), 'integer') as bigint
}

/**
 * Transforms a Base64 string into a Base64Url string.
 *
 * @param {string} data Base64 string to be transformed.
 * @returns Base64Url string.
 */
export function fromBase64 (data: string): string {
  return encode(Buffer.from(data, 'base64'))
}

/**
 * Transforms a Base64Url string into a Base64 string.
 *
 * @param {string} data Base64Url string to be transformed.
 * @returns Base64 string.
 */
export function toBase64 (data: string): string {
  return decode(data).toString('base64')
}
