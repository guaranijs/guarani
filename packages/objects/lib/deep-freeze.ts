import { DeepReadonly } from '@guarani/types';

/**
 * Recursively freezes the properties or items of the provided object.
 *
 * @param obj Object to be frozen.
 * @returns Frozen object.
 */
export function deepFreeze<T>(obj: T): DeepReadonly<T> {
  Object.freeze(obj);

  Object.values(obj).forEach((value) => {
    if ((typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
      if (Array.isArray(value)) {
        value.forEach((elm) => deepFreeze(elm));
      }

      deepFreeze(value);
    }
  });

  return obj;
}
