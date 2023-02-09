import { InjectableToken, isInjectableToken } from '../types/injectable-token.type';

/**
 * Denotes a Token Provider.
 */
export interface TokenProvider<T> {
  /**
   * Injectable Token to be aliased on the resolution of the original Injectable Token of the Provider.
   */
  readonly useToken: InjectableToken<T>;
}

/**
 * Checks if the provided object is a Token Provider.
 *
 * @param obj Object to be checked.
 */
export function isTokenProvider<T = any>(obj: unknown): obj is TokenProvider<T> {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const { useToken } = <TokenProvider<T>>obj;

  return isInjectableToken(useToken);
}
