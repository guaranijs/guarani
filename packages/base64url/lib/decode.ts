import { bufferToInteger } from '@guarani/primitives';
import { Optional } from '@guarani/types';

/**
 * Decodes a Base64Url string into a Buffer object.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @returns Buffer object.
 */
export function decode(data: string, format: typeof Buffer): Buffer;

/**
 * Decodes a Base64Url string into a Base64 string.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @returns Base64 string.
 */
export function decode(data: string, format: StringConstructor): string;

/**
 * Decodes a Base64Url string into a BigInt object.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @param asTwosComplement Treats the provided Integer as Two Complemented.
 * @returns BigInt object.
 */
export function decode(data: string, format: BigIntConstructor, asTwosComplement?: Optional<true>): bigint;

/**
 * Decodes a Base64Url string into a Number object.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @param asTwosComplement Treats the provided Integer as Two Complemented.
 * @returns Number object.
 */
export function decode(data: string, format: NumberConstructor, asTwosComplement?: Optional<true>): number;

/**
 * Decodes a Base64Url string back into its original type.
 *
 * @param data Base64Url string to be decoded.
 * @param format Indicates the original type of the data.
 * @param asTwosComplement Treats the provided Integer as Two Complemented.
 * @returns Decoded Base64Url string.
 */
export function decode(
  data: string,
  format: typeof Buffer | StringConstructor | BigIntConstructor | NumberConstructor,
  asTwosComplement?: Optional<true>
): Buffer | string | bigint | number {
  if (typeof data !== 'string') {
    throw new TypeError('Invalid parameter "data".');
  }

  const b64String = data
    .concat('='.repeat(data.length % 4))
    .replace(/===/g, '=') // Hack: Sometimes the above creates three paddings.
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // The previous hack is just so that we don't work more than needed.
  if (format === String) {
    return b64String;
  }

  const buffer = Buffer.from(b64String, 'base64');

  if (format === Buffer) {
    return buffer;
  }

  if (format === Number || format === BigInt) {
    const integer = bufferToInteger(buffer, asTwosComplement);
    return format === Number ? Number(integer) : integer;
  }

  throw new TypeError('Invalid parameter "format".');
}
