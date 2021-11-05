import { fromBuffer, toBuffer } from './primitives'

/**
 * Encodes a Buffer object into a Base64Url string.
 *
 * @param data Buffer to be encoded.
 * @returns Encoded Base64Url string.
 */
export function encode(data: Buffer): string

/**
 * Encodes a Base64 string into a Base64Url string.
 *
 * @param data Base64 string to be encoded.
 * @returns Base64Url string.
 */
export function encode(data: string): string

/**
 * Encodes an Integer into a Base64Url string.
 *
 * @param data Integer to be encoded.
 * @returns Encoded Base64Url string.
 */
export function encode(data: number | bigint): string

/**
 * Encodes the provided data into a Base64Url string.
 *
 * @param data Data to be encoded.
 * @returns Encoded Base64Url string.
 */
export function encode(data: string | number | bigint | Buffer): string {
  let buffer: Buffer

  if (
    !Buffer.isBuffer(data) &&
    typeof data !== 'string' &&
    typeof data !== 'number' &&
    typeof data !== 'bigint'
  ) {
    throw new Error('Invalid data.')
  }

  if (typeof data === 'string') {
    buffer = Buffer.from(data, 'base64')
  } else if (typeof data === 'number' || typeof data === 'bigint') {
    buffer = toBuffer(data)
  } else {
    buffer = data
  }

  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Decodes a Base64Url string into a Buffer object.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @returns Buffer object.
 */
export function decode(data: string, format: typeof Buffer): Buffer

/**
 * Decodes a Base64Url string into a BigInt object.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @returns BigInt object.
 */
export function decode(data: string, format: BigIntConstructor): bigint

/**
 * Decodes a Base64Url string into a Base64 string.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @returns Base64 string.
 */
export function decode(data: string, format: StringConstructor): string

/**
 * Decodes a Base64Url string into a Number object.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @returns Number object.
 */
export function decode(data: string, format: NumberConstructor): number

/**
 * Decodes a Base64Url string back into its original type.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @returns Decoded Base64Url string.
 */
export function decode(
  data: string,
  format:
    | typeof Buffer
    | BigIntConstructor
    | StringConstructor
    | NumberConstructor
): string | number | bigint | Buffer {
  const newData = data
    .concat('='.repeat(data.length % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const buffer = Buffer.from(newData, 'base64')

  if (format === Buffer) {
    return buffer
  }

  if (format === String) {
    return buffer.toString('base64')
  }

  if (format === Number) {
    return fromBuffer(buffer, Number)
  }

  if (format === BigInt) {
    return fromBuffer(buffer, BigInt)
  }

  throw new TypeError('Invalid parameter "format".')
}

/**
 * Returns the length of the Buffer version of a Base64Url string.
 *
 * @param data Base64Url string to be analyzed.
 * @returns Length of the Buffer version of the Base64Url string.
 */
export function b64Length(data: string): number {
  return decode(data, Buffer).length
}
