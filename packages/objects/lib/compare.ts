import { Comparable } from '@guarani/types';

/**
 * Compares two objects and returns one of the following values:
 *
 * * **0**: If both objects are **equal**.
 * * **-1**: If `obj1` is **smaller than** `obj2`.
 * * **1**: If `obj1` is **greater than** `obj2`.
 *
 * @param obj1 Object to be compared.
 * @param obj2 Object to be compared.
 * @returns Result of the comparison.
 */
export function compare(obj1: unknown, obj2: unknown): number {
  if (obj1 === undefined && obj2 === undefined) {
    return 0;
  }

  if (obj1 === null && obj2 === null) {
    return 0;
  }

  if (
    (typeof obj1 === 'bigint' && typeof obj2 === 'bigint') ||
    (typeof obj1 === 'number' && typeof obj2 === 'number') ||
    (typeof obj1 === 'string' && typeof obj2 === 'string')
  ) {
    return obj1 === obj2 ? 0 : obj1 < obj2 ? -1 : 1;
  }

  if (Buffer.isBuffer(obj1) && Buffer.isBuffer(obj2)) {
    return Buffer.compare(obj1, obj2);
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length === 0 && obj2.length === 0) {
      return 0;
    }

    if (obj1.length === 0) {
      return -1;
    }

    if (obj2.length === 0) {
      return 1;
    }

    const length = Math.min(obj1.length, obj2.length);

    for (let i = 0; i < length; i++) {
      const result = compare(obj1[i], obj2[i]);

      if (result !== 0) {
        return result;
      }
    }

    return obj1.length === obj2.length ? 0 : obj1.length < obj2.length ? -1 : 1;
  }

  if (obj1 instanceof (<object>obj2).constructor || obj2 instanceof (<object>obj1).constructor) {
    return (<Comparable<unknown>>obj1).compare(obj2);
  }

  throw new TypeError('Unsupported comparison of objects of different types.');
}
