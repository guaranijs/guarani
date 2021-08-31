import { ClassProvider, isClassProvider } from './class.provider'
import { FactoryProvider, isFactoryProvider } from './factory.provider'
import { isTokenProvider, TokenProvider } from './token.provider'
import { isValueProvider, ValueProvider } from './value.provider'

/**
 * Defines the available providers.
 */
export type Provider<T> = Partial<ClassProvider<T>> &
  Partial<FactoryProvider<T>> &
  Partial<TokenProvider<T>> &
  Partial<ValueProvider<T>>

/**
 * Validates whether or not the provided object is a Provider.
 *
 * @param provider Object to be validated.
 * @returns The object is a Provider.
 */
export function isProvider<T>(provider: any): provider is Provider<T> {
  return (
    isClassProvider<T>(provider) ||
    isFactoryProvider<T>(provider) ||
    isTokenProvider<T>(provider) ||
    isValueProvider<T>(provider)
  )
}
