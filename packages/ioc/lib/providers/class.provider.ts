import { Constructor } from '@guarani/types';

/**
 * Defines the format of a Class Provider.
 */
export interface ClassProvider<T> {
  /**
   * Class to be used when resolving the bound token.
   */
  readonly target: Constructor<T>;
}

/**
 * Validates whether or not the provided object is a Class Provider.
 *
 * @param obj Object to be validated.
 * @returns The provided object is a Class Provider.
 */
export function isClassProvider<T>(obj: unknown): obj is ClassProvider<T> {
  return (obj as ClassProvider<T>).target !== undefined;
}
