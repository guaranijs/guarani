import { Factory } from '@guarani/utils'

import { Provider } from './provider'

/**
 * Defines the format of a Factory Provider.
 */
export interface FactoryProvider<T> {
  /**
   * Factory to be used when resolving the bound token.
   */
  readonly factory: Factory<T>
}

/**
 * Validates whether or not the provider is a Factory Provider.
 *
 * @param provider - Provider to be validated.
 * @returns The provider is a Factory Provider.
 */
export function isFactoryProvider<T>(
  provider: Provider<T>
): provider is FactoryProvider<T> {
  return typeof (provider as FactoryProvider<T>).factory === 'function'
}
