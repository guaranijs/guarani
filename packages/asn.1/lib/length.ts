import { integerToBuffer } from '@guarani/primitives';
import { Optional } from '@guarani/types';

import { DecodingException } from './exceptions/decoding.exception';

/**
 * Encodes the length of an ASN.1 Type using either the Short Form or the Long Form into an unsigned integer buffer.
 *
 * The Short Form is used when the length of the value is less than 128. The bit 8 is set to "0" and the rest
 * of the bits define the actual length of the value.
 *
 * The Long Form is used when the length of the value is greater than or equal to 128. The first byte of the length
 * defines the number of octets that represent the actual length. Its bit 8 is set to "1" and the rest of the bits
 * define the number of octets that will be used to represent the length of the value. The second and following octets
 * represent the actual length of the value, base 256, most significant digit first.
 *
 * @param length Length of the value in decimal.
 * @param longForm Indicates if a length smaller than 128 has to be encoded using the Long Form.
 * @returns Buffer object representing the encoded length.
 */
export function encodeLength(length: number, long?: Optional<true>): Buffer {
  if (typeof length !== 'number') {
    throw new TypeError('Invalid parameter "length".');
  }

  const encodedLength = integerToBuffer(length);

  if (length < 0x80) {
    return long === true ? Buffer.from([0x80 + encodedLength.length, ...encodedLength]) : encodedLength;
  }

  if (encodedLength.length > 0x7e) {
    throw new RangeError('Unsupported large number.');
  }

  return Buffer.from([0x80 + encodedLength.length, ...encodedLength]);
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
 * @param data Buffer object representing the encoded length.
 * @returns Integer representing the actual length.
 */
export function decodeLength(data: Buffer): number {
  if (!Buffer.isBuffer(data)) {
    throw new TypeError('Invalid parameter "data".');
  }

  let offset = 0;
  let length = data[offset++];

  if (length === 0xff) {
    throw new DecodingException('Invalid length long form.');
  }

  // Long form
  if ((length & 0x80) !== 0x00) {
    const bytes = Number(length & 0x7f);

    length = 0;

    for (let i = 0; i < bytes; i++) {
      length = (length << 8) | data[offset + i];
    }
  }

  return length;
}
