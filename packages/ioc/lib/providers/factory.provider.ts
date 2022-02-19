/**
 * Defines the format of a Factory Provider.
 */
export interface FactoryProvider<T> {
  /**
   * Factory to be used when resolving the bound token.
   */
  readonly factory: () => T;
}

/**
 * Validates whether or not the provided object is a Factory Provider.
 *
 * @param obj Object to be validated.
 * @returns The provided object is a Factory Provider.
 */
export function isFactoryProvider<T>(obj: unknown): obj is FactoryProvider<T> {
  return typeof (obj as FactoryProvider<T>).factory === 'function';
}
