/**
 * Tools to work with primitive types of NodeJS.
 *
 * @module Primitives
 */

type BufferEncoding =
  | 'ascii'
  | 'utf8'
  | 'utf-8'
  | 'utf16le'
  | 'ucs2'
  | 'ucs-2'
  | 'base64'
  | 'latin1'
  | 'binary'
  | 'hex'

/**
 * Decodes a Buffer back to its original integer.
 * Note: It assumes that the Buffer represents an integer.
 *
 * @param data - Buffer representation of an integer.
 * @returns Integer represented by the provided Buffer.
 */
function bufferToInt(data: Buffer): bigint {
  if (!Buffer.isBuffer(data)) throw new TypeError('Invalid parameter "data".')

  const strRepr = data.reduce((res, item) => {
    let n = item.toString(16)
    if (n.length === 1) n = `0${n}`
    return res.concat(n)
  }, '')

  return BigInt(`0x${strRepr || '00'}`)
}

/**
 * Encodes an integer as a Buffer.
 *
 * @param integer - Integer to be encoded.
 * @returns Buffer representation of the integer.
 */
function intToBuffer(integer: bigint | number): Buffer {
  integer = BigInt(integer)

  const len = Math.floor((integer.toString(2).length + 7) / 8)
  const arr = new Uint8Array(len)

  let hexRepr = integer.toString(16)

  if (hexRepr.length % 2 === 1) hexRepr = `0${hexRepr}`

  for (let i = 0; i < len; i++)
    arr[i] = Number.parseInt(hexRepr.slice(2 * i, 2 * (i + 1)), 16)

  return Buffer.from(arr)
}

/**
 * Reverses a Buffer object back to a primitive type.
 *
 * @param buffer - Buffer to be reversed back to a primitive type.
 * @param format - Defines the output format of the reversed data.
 * @param encoding - Optional encoding format for the string output.
 * @returns Primitive data converted from the provided Buffer object.
 */
export function fromBuffer(
  buffer: Buffer,
  format: 'string',
  encoding?: BufferEncoding
): string
export function fromBuffer(buffer: Buffer, format: 'integer'): bigint
export function fromBuffer(
  buffer: Buffer,
  format: 'string' | 'integer',
  encoding?: BufferEncoding
) {
  if (!Buffer.isBuffer(buffer))
    throw new TypeError('Invalid parameter "buffer".')

  if (format === 'string') return buffer.toString(encoding)
  if (format === 'integer') return bufferToInt(buffer)

  throw new TypeError('Invalid parameter "format".')
}

/**
 * Converts the provided data into a Buffer object.
 *
 * @param data - Data to be converted.
 * @throws TypeError: The data provided is not supported.
 * @returns Resulting Buffer object.
 */
export function toBuffer(data: Buffer): Buffer
export function toBuffer(data: string): Buffer
export function toBuffer(data: bigint | number): Buffer
export function toBuffer(data: Buffer | string | bigint | number): Buffer {
  if (Buffer.isBuffer(data)) return data

  if (typeof data === 'string') return Buffer.from(data, 'utf8')

  if (typeof data === 'bigint' || typeof data === 'number')
    return intToBuffer(data)

  throw new TypeError('The provided data is in an unsupported format.')
}
