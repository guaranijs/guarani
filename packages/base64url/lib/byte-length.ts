import { decode as b64urlDecode } from './decode';

/**
 * Returns the length of the Buffer version of a Base64Url string.
 *
 * @param data Base64Url string to be analyzed.
 * @returns Length of the Buffer version of the Base64Url string.
 */
export function byteLength(data: string): number {
  return b64urlDecode(data, Buffer).length;
}
