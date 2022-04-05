import { InjectableToken } from '../tokens';

/**
 * Defines the format of a Token Provider.
 */
export interface TokenProvider<T> {
  /**
   * Token to be aliased when resolving the original bound token.
   */
  readonly token: InjectableToken<T>;
}

/**
 * Validates whether or not the provided object is a Token Provider.
 *
 * @param obj Object to be validated.
 * @returns The provided object is a Token Provider.
 */
export function isTokenProvider<T>(obj: unknown): obj is TokenProvider<T> {
  return (obj as TokenProvider<T>).token !== undefined;
}
