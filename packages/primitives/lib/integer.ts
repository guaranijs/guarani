import { Optional } from '@guarani/types';

import { bufferToUnsignedInteger, flipBufferBits } from './buffer';

/**
 * Encodes the provided unsigned Integer into a Buffer.
 *
 * @param integer Unsigned Integer to be encoded.
 * @returns Encoded Buffer.
 */
function unsignedIntegerToBuffer(integer: bigint): Buffer {
  let hex = integer.toString(16);

  if (hex.length % 2 !== 0) {
    hex = `0${hex}`;
  }

  const bytes = hex.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16));

  return Buffer.from(bytes);
}

/**
 * Encodes the provided Integer into a Buffer.
 *
 * @param integer Integer to be encoded.
 * @param asTwosComplement Represents Natural Number Buffers starting in
 * **0b1xxxxxxx** as positive by appending a **0x00** byte at the beginning.
 * @returns Encoded Buffer.
 */
export function integerToBuffer(integer: number | bigint, asTwosComplement?: Optional<true>): Buffer {
  if (typeof integer !== 'bigint' && typeof integer !== 'number') {
    throw new TypeError('Invalid parameter "integer".');
  }

  if (typeof integer === 'number' && !Number.isInteger(integer)) {
    throw new TypeError('Invalid parameter "integer".');
  }

  const data = BigInt(integer);
  const unsignedInteger = data < 0n ? data * -1n : data;

  let unsignedBuffer = unsignedIntegerToBuffer(unsignedInteger);

  if (data >= 0n) {
    return asTwosComplement === true && (unsignedBuffer[0] & 0x80) !== 0x00
      ? Buffer.from([0x00, ...unsignedBuffer])
      : unsignedBuffer;
  }

  if (data > 0 && (unsignedBuffer[0] & 0x80) !== 0x00) {
    unsignedBuffer = Buffer.from([0x00, ...unsignedBuffer]);
  }

  const reciprocal = flipBufferBits(unsignedBuffer);
  const complementedInteger = bufferToUnsignedInteger(reciprocal) + 1n;

  let complemented = unsignedIntegerToBuffer(complementedInteger);

  if ((complemented[0] & 0x80) === 0x00) {
    complemented = Buffer.from([0xff, ...complemented]);
  }

  return complemented;
}
