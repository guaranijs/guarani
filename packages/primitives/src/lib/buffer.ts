import { Buffer } from 'buffer';

import { integerToBuffer } from './integer';

// #region Bitstring
/**
 * Pads the provided bitstring until its length is a multiple of 8.
 *
 * @param bitstring Bitstring to be padded.
 * @returns Padded bitstring.
 */
function padBitstring(bitstring: string): string {
  if (bitstring.match(/[^01]+/) !== null) {
    throw new TypeError('The parameter "bitstring" is not a valid bitstring.');
  }

  const modulo = bitstring.length % 8;
  const missingBitsCount = modulo === 0 ? 0 : 8 - modulo;

  return bitstring.padStart(bitstring.length + missingBitsCount, '0');
}

/**
 * Returns the bitstring representation of the provided Buffer.
 *
 * @param buffer Buffer to be encoded.
 * @returns Resulting bitstring.
 */
export function bufferToBitstring(buffer: Buffer): string {
  return buffer.reduce((bits, byte) => (bits += padBitstring(byte.toString(2))), '');
}

/**
 * Returns the Buffer representation of the provided bitstring.
 *
 * @param bitstring Bitstring to be decoded.
 * @returns Resulting Buffer.
 */
export function bitstringToBuffer(bitstring: string): Buffer {
  if (bitstring.match(/[^01]+/) !== null) {
    throw new TypeError('The parameter "bitstring" is not a valid bitstring.');
  }

  const paddedBitstring = padBitstring(bitstring);
  const bitstringBytes = paddedBitstring.match(/.{8}/g) ?? [];
  const bytes = bitstringBytes.map((byte) => Number.parseInt(byte, 2));

  return Buffer.from(bytes);
}
// #endregion

// #region Integer
/**
 * Returns the Unsigned Integer value of the provided Buffer.
 *
 * @param buffer Buffer to be transformed.
 * @param endianness Indicates the Endianness of the Buffer to correctly parse the Unsigned Integer.
 * @returns Unsigned Integer based on the provided Buffer.
 */
function bufferToUnsignedInteger(buffer: Buffer): bigint {
  if (buffer.length === 0) {
    throw new TypeError('The provided buffer must not be empty.');
  }

  return buffer.reduce((result, byte) => (result << 8n) | BigInt(byte), 0n);
}

/**
 * Returns the original unsigned Buffer from the provided Two's Complemented Buffer.
 *
 * @param buffer Buffer to be transformed.
 * @returns Original unsigned Buffer.
 */
function fromTwosComplement(buffer: Buffer): Buffer {
  const complemented = bufferToUnsignedInteger(buffer);
  const reciprocal = integerToBuffer(complemented - 1n);
  const original = Buffer.from(reciprocal.map((byte) => ~byte));

  return original[0] === 0x00 ? original.subarray(1) : original;
}

/**
 * Returns the Integer value of the provided Buffer.
 *
 * @param buffer Buffer to be transformed.
 * @param asTwosComplement The provided Buffer is in Two's Complement format.
 * @returns Integer based on the provided Buffer.
 */
export function bufferToInteger(buffer: Buffer, asTwosComplement?: true): bigint {
  if (buffer.length === 0) {
    throw new Error('The provided buffer must not be empty.');
  }

  const complemented = asTwosComplement === true && (buffer[0]! & 0x80) !== 0x00 ? fromTwosComplement(buffer) : buffer;
  const integer = bufferToUnsignedInteger(complemented);

  return asTwosComplement === true && (buffer[0]! & 0x80) !== 0x00 ? -integer : integer;
}
// #endregion
