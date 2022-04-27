import { Constructor } from '@guarani/types';

/**
 * Defines the format of a Class Provider.
 */
export interface ClassProvider<T> {
  /**
   * Constructor to be used on the resolution of the Provider.
   */
  readonly useClass: Constructor<T>;
}

/**
 * Checks if the provided object is a Class Provider.
 *
 * @param obj Object to be checked.
 */
export function isClassProvider<T = any>(obj: unknown): obj is ClassProvider<T> {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const { useClass } = <ClassProvider<T>>obj;

  return typeof useClass === 'function' && useClass.prototype !== undefined;
}
