/**
 * Denotes a Value Provider.
 */
export interface ValueProvider<T> {
  /**
   * Value to be used on the resolution of the Provider.
   */
  readonly useValue: T;
}

/**
 * Checks if the provided object is a Value Provider.
 *
 * @param obj Object to be checked.
 */
export function isValueProvider<T = any>(obj: unknown): obj is ValueProvider<T> {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  return Object.hasOwn(obj, 'useValue');
}
