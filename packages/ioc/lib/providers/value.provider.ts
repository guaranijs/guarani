import { Provider } from './provider'

/**
 * Defines the format of a Value Provider.
 */
export interface ValueProvider<T> {
  /**
   * Value to be used when resolving the bound token.
   */
  readonly value: T
}

/**
 * Validates whether or not the provider is a Value Provider.
 *
 * @param provider - Provider to be validated.
 * @returns The provider is a Value Provider.
 */
export function isValueProvider<T>(
  provider: Provider<T>
): provider is ValueProvider<T> {
  return (provider as ValueProvider<T>).value !== undefined
}
