import { Provider } from './provider'
import { Constructor } from '../types'

/**
 * Defines the format of a Class Provider.
 */
export interface ClassProvider<T> {
  /**
   * Class to be used when resolving the bound token.
   */
  readonly useClass: Constructor<T>
}

/**
 * Validates whether or not the provider is a Class Provider.
 *
 * @param provider - Provider to be validated.
 * @returns The provider is a Class Provider.
 */
export function isClassProvider<T>(
  provider: Provider<T>
): provider is ClassProvider<T> {
  return (provider as ClassProvider<T>).useClass != null
}
