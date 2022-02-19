import { integerToBuffer } from '@guarani/primitives';
import { Optional } from '@guarani/types';

/**
 * Encodes a Buffer object into a Base64Url string.
 *
 * @param data Buffer to be encoded.
 * @returns Encoded Base64Url string.
 */
export function encode(data: Buffer): string;

/**
 * Encodes a Base64 string into a Base64Url string.
 *
 * @param data Base64 string to be encoded.
 * @returns Base64Url string.
 */
export function encode(data: string): string;

/**
 * Encodes an Integer into a Base64Url string.
 *
 * @param data Integer to be encoded.
 * @param asTwosComplement Treats the provided Integer as Two Complemented.
 * @returns Encoded Base64Url string.
 */
export function encode(data: number | bigint, asTwosComplement?: Optional<true>): string;

/**
 * Encodes the provided data into a Base64Url string.
 *
 * @param data Data to be encoded.
 * @param asTwosComplement Treats the provided Integer as Two Complemented.
 * @returns Encoded Base64Url string.
 */
export function encode(data: string | number | bigint | Buffer, asTwosComplement?: Optional<true>): string {
  if (!Buffer.isBuffer(data) && typeof data !== 'string' && typeof data !== 'number' && typeof data !== 'bigint') {
    throw new Error('Invalid parameter "data".');
  }

  let buffer: Buffer;

  if (typeof data === 'string') {
    buffer = Buffer.from(data, 'base64');
  } else if (typeof data === 'number' || typeof data === 'bigint') {
    buffer = integerToBuffer(data, asTwosComplement);
  } else {
    buffer = data;
  }

  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
