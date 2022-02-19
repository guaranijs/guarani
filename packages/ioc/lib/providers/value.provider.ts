/**
 * Defines the format of a Value Provider.
 */
export interface ValueProvider<T> {
  /**
   * Value to be used when resolving the bound token.
   */
  readonly value: T;
}

/**
 * Validates whether or not the provided object is a Value Provider.
 *
 * @param obj Object to be validated.
 * @returns The provided object is a Value Provider.
 */
export function isValueProvider<T>(obj: unknown): obj is ValueProvider<T> {
  return (obj as ValueProvider<T>).value !== undefined;
}
