import { Optional } from '@guarani/types';

import { randomInt } from 'crypto';

/**
 * Generates a cryptographically secure, urlsafe, random secret token.
 *
 * @param length Length of the token.
 * @returns Secret Token.
 */
export function secretToken(length: Optional<number> = 32): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!Number.isInteger(length)) {
      return reject(new Error('The length MUST be an integer.'));
    }

    if (length < 1) {
      return reject(new Error('The length MUST be greater than zero.'));
    }

    let token = '';
    const alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

    for (let i = 0; i < length; i++) {
      token += alphabet[randomInt(alphabet.length)];
    }

    return resolve(token);
  });
}
