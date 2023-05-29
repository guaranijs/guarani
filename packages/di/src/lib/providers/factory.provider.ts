import { Factory } from '../types/factory.type';

/**
 * Denotes a Factory Provider.
 */
export interface FactoryProvider<T> {
  /**
   * Factory function to be used on the resolution of the Provider.
   */
  readonly useFactory: Factory<T>;
}

/**
 * Checks if the provided object is a Factory Provider.
 *
 * @param obj Object to be checked.
 */
export function isFactoryProvider<T>(obj: unknown): obj is FactoryProvider<T> {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const { useFactory } = <FactoryProvider<T>>obj;

  return typeof useFactory === 'function' && typeof useFactory.prototype === 'undefined';
}
