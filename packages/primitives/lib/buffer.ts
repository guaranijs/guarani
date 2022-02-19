import { Optional } from '@guarani/types';

import { integerToBuffer } from './integer';

export type Endianness = 'be' | 'le';

/**
 * Pads the provided bitstring until its length is a multiple of 8.
 *
 * @param bits Bitstring to be padded.
 * @param endianness Defines if the padding will be added at the beginning or at the end of the bitstring.
 * @returns Padded bitstring.
 */
export function padBits(bits: string, endianness: Endianness): string {
  const modulo = bits.length % 8;
  const unusedBits = modulo === 0 ? 0 : 8 - (bits.length % 8);

  let paddedBits = bits;

  if (unusedBits !== 0) {
    const padding = '0'.repeat(unusedBits);
    paddedBits = endianness === 'be' ? `${padding}${paddedBits}` : `${paddedBits}${padding}`;
  }

  return paddedBits;
}

/**
 * Returns the Binary String representation of the provided Buffer.
 *
 * @param buffer Buffer to be encoded.
 * @param endianness Defines if the padding will be added at the beginning or at the end of the bitstring.
 * @returns Binary String representation of the provided Buffer.
 */
export function bufferToBinary(buffer: Buffer, endianness: Optional<Endianness> = 'be'): string {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Invalid parameter "buffer".');
  }

  return buffer.reduce((bits, byte) => (bits += padBits(byte.toString(2), endianness)), '');
}

/**
 * Returns the Buffer representation of the provided Binary String.
 *
 * @param bits Binary String to be decoded.
 * @param endianness Defines if the padding will be added at the beginning or at the end of the bitstring.
 * @returns Buffer representation of the provided Binary String.
 */
export function binaryToBuffer(bits: string, endianness: Optional<Endianness> = 'be'): Buffer {
  const paddedBits = padBits(bits, endianness);
  const binaryBytes = paddedBits.match(/.{8}/g) ?? [];
  const bytes = binaryBytes.map((byte) => Number.parseInt(byte, 2));

  return Buffer.from(bytes);
}

/**
 * Performs a bitwise NOT operation on the provided Buffer.
 *
 * @param buffer Buffer to be transformed.
 * @returns Buffer that contains the flipped bits.
 */
export function flipBufferBits(buffer: Buffer): Buffer {
  if (buffer.length === 0) {
    throw new Error('The provided buffer must not be empty.');
  }

  // buffer.toString("binary") returns latin1 characteres.
  const bits = bufferToBinary(buffer);

  const flippedBits = bits
    .split('')
    .map((bit) => (bit === '0' ? '1' : '0'))
    .join('');

  return binaryToBuffer(flippedBits);
}

/**
 * Returns the Unsigned Integer value of the provided Buffer.
 *
 * @param buffer Buffer to be transformed.
 * @returns Unsigned Integer based on the provided Buffer.
 */
export function bufferToUnsignedInteger(buffer: Buffer): bigint {
  if (buffer.length === 0) {
    throw new Error('The provided buffer must not be empty.');
  }

  return buffer.reduce((result, byte) => (result << 8n) | BigInt(byte), 0n);
}

/**
 * Returns the original unsigned Buffer from the provided
 * Two's Complemented Buffer.
 *
 * @param buffer Buffer to be transformed.
 * @returns Original unsigned Buffer.
 */
function fromTwosComplement(buffer: Buffer): Buffer {
  if (buffer.length === 0) {
    throw new Error('The provided buffer must not be empty.');
  }

  const complemented = bufferToUnsignedInteger(buffer);
  const reciprocal = integerToBuffer(complemented - 1n);
  const original = flipBufferBits(reciprocal);

  return original[0] === 0x00 ? original.subarray(1) : original;
}

/**
 * Returns the Integer value of the provided Buffer.
 *
 * @param buffer Buffer to be transformed.
 * @param asTwosComplement The provided Buffer is in Two's Complement format.
 * @returns Integer based on the provided Buffer.
 */
export function bufferToInteger(buffer: Buffer, asTwosComplement?: Optional<true>): bigint {
  if (buffer.length === 0) {
    throw new Error('The provided buffer must not be empty.');
  }

  const complemented = asTwosComplement === true && (buffer[0] & 0x80) !== 0x00 ? fromTwosComplement(buffer) : buffer;
  const integer = bufferToUnsignedInteger(complemented);

  return asTwosComplement === true && (buffer[0] & 0x80) !== 0x00 ? -integer : integer;
}
