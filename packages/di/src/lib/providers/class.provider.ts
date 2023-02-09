import { AbstractConstructor } from '../types/abstract-constructor.interface';
import { Constructor } from '../types/constructor.interface';

/**
 * Denotes a Class Provider.
 */
export interface ClassProvider<T> {
  /**
   * Constructor to be used on the resolution of the Provider.
   */
  readonly useClass: AbstractConstructor<T> | Constructor<T>;
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
