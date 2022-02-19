import { encode } from '@guarani/base64url'
import { Optional } from '@guarani/types'

import { randomBytes } from 'crypto'
import { promisify } from 'util'

import { JsonWebKeyParams } from '../../jsonwebkey'
import { OctKey } from './oct.key'

const randomBytesAsync = promisify(randomBytes)

/**
 * Generates a new OctKey.
 *
 * @param size Size of the secret in bytes.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an OctKey.
 */
export async function generateOctKey(
  size: number,
  options?: Optional<JsonWebKeyParams>
): Promise<OctKey> {
  if (!Number.isInteger(size)) {
    throw new TypeError('The secret size MUST be a valid integer.')
  }

  if (size < 1) {
    throw new Error('Invalid secret size.')
  }

  const secret = encode(await randomBytesAsync(size))

  return new OctKey({ k: secret }, options)
}
