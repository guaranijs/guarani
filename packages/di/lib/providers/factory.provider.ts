import { FactoryFunction } from '../types/factory-function';

/**
 * Defines the format of a Factory Provider.
 */
export interface FactoryProvider<T> {
  /**
   * Factory function to be used on the resolution of the Provider.
   */
  readonly useFactory: FactoryFunction<T>;
}

/**
 * Checks if the provided object is a Factory Provider.
 *
 * @param obj Object to be checked.
 */
export function isFactoryProvider<T = any>(obj: unknown): obj is FactoryProvider<T> {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const { useFactory } = <FactoryProvider<T>>obj;

  return typeof useFactory === 'function' && useFactory.prototype === undefined;
}
