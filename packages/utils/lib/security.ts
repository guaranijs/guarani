import { randomInt } from 'crypto'

/**
 * Generates a cryptographically secure, urlsafe, random secret token.
 *
 * @param length Length of the token.
 * @returns Secret Token.
 */
export function secretToken(length: number = 32): string {
  let token = ''
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

  for (let i = 0; i < length; i++) {
    token += alphabet[randomInt(alphabet.length)]
  }

  return token
}
