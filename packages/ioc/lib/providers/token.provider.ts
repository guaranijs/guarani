import { InjectableToken } from '../tokens'
import { Provider } from './provider'

/**
 * Defines the format of a Token Provider.
 */
export interface TokenProvider<T> {
  /**
   * Token to be aliased when resolving the original bound token.
   */
  readonly token: InjectableToken<T>
}

/**
 * Validates whether or not the provider is a Token Provider.
 *
 * @param provider - Provider to be validated.
 * @returns The provider is a Token Provider.
 */
export function isTokenProvider<T>(
  provider: Provider<T>
): provider is TokenProvider<T> {
  return (provider as TokenProvider<T>).token !== undefined
}
