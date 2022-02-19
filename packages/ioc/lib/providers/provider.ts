import { ClassProvider, isClassProvider } from './class.provider';
import { FactoryProvider, isFactoryProvider } from './factory.provider';
import { isTokenProvider, TokenProvider } from './token.provider';
import { isValueProvider, ValueProvider } from './value.provider';

/**
 * Defines the available providers.
 */
export type Provider<T> = Partial<ClassProvider<T>> &
  Partial<FactoryProvider<T>> &
  Partial<TokenProvider<T>> &
  Partial<ValueProvider<T>>;

/**
 * Validates whether or not the provided object is a Provider.
 *
 * @param obj Object to be validated.
 * @returns The provided object is a Provider.
 */
export function isProvider<T>(obj: unknown): obj is Provider<T> {
  return isClassProvider<T>(obj) || isFactoryProvider<T>(obj) || isTokenProvider<T>(obj) || isValueProvider<T>(obj);
}
