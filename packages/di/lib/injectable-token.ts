import { Constructor } from '@guarani/types';

import { LazyToken } from './lazy-token';

/**
 * Describes the acceptable formats for an Injectable token.
 */
export type InjectableToken<T> = string | symbol | Constructor<T> | LazyToken<T>;

/**
 * Checks if the provided object is an Injectable Token.
 *
 * @param obj Object to be checked.
 */
export function isInjectableToken<T = any>(obj: unknown): obj is InjectableToken<T> {
  return (
    typeof obj === 'string' ||
    typeof obj === 'symbol' ||
    (typeof obj === 'function' && obj.prototype !== undefined) ||
    obj instanceof LazyToken
  );
}
