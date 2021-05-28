import { Constructor } from '@guarani/utils'

/**
 * Describes the acceptable formats for an Injectable token.
 */
export type InjectableToken<T> = Constructor<T> | string | symbol

/**
 * Verifies if the provided token is a Constructor.
 *
 * @param token - Token to be verified.
 * @returns Verification that the token is a Constructor.
 */
export function isConstructorToken<T>(
  token: InjectableToken<T>
): token is Constructor<T> {
  return typeof token === 'function' && !!token.prototype
}

/**
 * Verifies if the provided token is a string or symbol.
 *
 * @param token - Token to be verified.
 * @returns Verification that the token is a valid string or symbol.
 */
export function isValueToken<T>(
  token: InjectableToken<T>
): token is string | symbol {
  return ['string', 'symbol'].includes(typeof token)
}
