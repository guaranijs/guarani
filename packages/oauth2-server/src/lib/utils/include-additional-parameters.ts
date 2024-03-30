import { removeNullishValues } from '@guarani/primitives';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

/**
 * Includes the provided parameters in the provided Object.
 *
 * @param obj Object being augmented.
 * @param parameters Parameters to be added to the provided Object.
 * @returns Augmented Object.
 */
export function includeAdditionalParameters<T extends Dictionary<unknown>>(
  obj: T,
  parameters: Partial<Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>> = {},
): T {
  Object.entries(parameters).forEach(([name, value]) => {
    Reflect.set(obj, name, value);
  });

  return removeNullishValues<T>(obj);
}
