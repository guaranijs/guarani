import { ClassProvider, isClassProvider } from './class.provider';
import { FactoryProvider, isFactoryProvider } from './factory.provider';
import { isTokenProvider, TokenProvider } from './token.provider';
import { isValueProvider, ValueProvider } from './value.provider';

/**
 * Defines the format of a Provider.
 */
export type Provider<T> =
  | Partial<ClassProvider<T>>
  | Partial<FactoryProvider<T>>
  | Partial<TokenProvider<T>>
  | Partial<ValueProvider<T>>;

/**
 * Checks if the provided object is a Provider.
 *
 * @param obj Object to be checked.
 */
export function isProvider<T = any>(obj: unknown): obj is Provider<T> {
  const checks = [isClassProvider<T>(obj), isFactoryProvider<T>(obj), isTokenProvider<T>(obj), isValueProvider<T>(obj)];
  return checks.filter((check) => check === true).length === 1;
}
