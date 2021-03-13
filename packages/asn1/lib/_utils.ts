/**
 * Utility functionalities used by the ASN1 package.
 */

import { Primitives } from '@guarani/utils'

/**
 * This function encodes the length of a primitive type using either
 * the Short Form or the Long Form into an unsigned integer buffer.
 *
 * The Short Form is used when the length of the value is less than 128.
 * The bit 8 is set to "0" and the rest of the bits
 * define the actual length of the value.
 *
 * The Long Form is used when the length of the value
 * is greater than or equal to 128.
 * The first byte of the length defines the number of octets
 * that represent the actual length.
 * Its bit 8 is set to "1" and the rest of the bits
 * define the number of octets that will be used
 * to represent the length of the value.
 * The second and following octets represent the actual length of the value,
 * base 256, most significant digit first.
 *
 * @param length - Length of the value in decimal.
 * @returns Buffer object representing the encoded length.
 */
export function encodeLength(length: number): Buffer {
  if (typeof length !== 'number')
    throw new TypeError('Invalid parameter "length".')

  if (length < 0x80) return Primitives.toBuffer(length)

  const asBuffer = Primitives.toBuffer(length)

  if (asBuffer.length > 127) throw new RangeError('Unsupported large number.')

  return Buffer.from([0x80 + asBuffer.length, ...asBuffer])
}

/**
 * This function decodes an encoded length represented by a Buffer object.
 *
 * If the MSB of the data is 0, it is assumed to be a Short Form,
 * where the byte represents the actual value of the length.
 *
 * If the MSB of the data is 1, it is assumed to be a Long form,
 * where the rest of the bits represent the number of bytes used to represent
 * the length, up to a maximum of 127 bytes, and the following bytes
 * are then treated entirely as one number representing the actual length.
 *
 * @param data - Buffer object representing the encoded length.
 * @returns Integer representing the actual length.
 */
export function decodeLength(data: Buffer): number {
  if (!Buffer.isBuffer(data)) throw new TypeError('Invalid parameter "data".')

  let offset = 0
  let length = data[offset++]

  // Long form
  if (length & 0x80) {
    const bytes = length & 0x7f
    length = 0
    for (let i = 0; i < bytes; i++) length = (length << 8) | data[offset + i]
  }

  return length
}
