import { Optional } from '@guarani/types';

import { JsonWebKeyParams } from '../../jsonwebkey';
import { OctKey } from './oct.key';

/**
 * Parses a Base64 encoded Secret into an OctKey.
 *
 * @param secret Base64 representation of the Secret.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an OctKey.
 */
export function parseOctKey(secret: string, options?: Optional<JsonWebKeyParams>): OctKey;

/**
 * Parses a Binary encoded Secret into an OctKey.
 *
 * @param secret Binary representation of the Secret.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an OctKey.
 */
export function parseOctKey(secret: Buffer, options?: Optional<JsonWebKeyParams>): OctKey;

/**
 * Parses the provided Secret into an OctKey.
 *
 * @param secret Secret to be parsed.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an OctKey.
 */
export function parseOctKey(secret: string | Buffer, options?: Optional<JsonWebKeyParams>): OctKey {
  if (!Buffer.isBuffer(secret) && typeof secret !== 'string') {
    throw new TypeError('Invalid parameter "secret".');
  }

  if (secret.length === 0) {
    throw new Error('The secret must not be empty.');
  }

  const buffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret, 'base64');

  return new OctKey({ k: buffer.toString('base64url') }, options);
}
