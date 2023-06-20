import { Buffer } from 'buffer';

import { Comparable, Dictionary } from '@guarani/types';

/**
 * Removes null and undefined values from the properties of an object or an array of objects.
 *
 * @param data Object or array of objects to be cleansed.
 */
export function removeNullishValues<T = unknown>(data: T): T {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  Object.entries(data).forEach(([key, value]) => {
    switch (true) {
      case value == null:
        Reflect.deleteProperty(data, key);
        break;

      case Array.isArray(value):
        value = value.filter((v: any) => v != null);
        value.forEach(removeNullishValues);
        Reflect.set(data, key, value);
        break;

      case typeof value === 'object':
        removeNullishValues(value);
        Reflect.set(data, key, value);
        break;

      default:
        break;
    }
  });

  return data;
}

/**
 * Checks if the provided data is a Plain Javascript Object.
 *
 * @param data Object to be checked.
 * @returns The provided data is a Plain Javascript Object.
 */
export function isPlainObject(data: unknown): data is Dictionary<unknown> {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(data);

  return proto === null || proto === Object.prototype;
}

/**
 * Compares two objects and returns one of the following values:
 *
 * * **0**: If both objects are **equal**.
 * * **< 0**: If `obj1` is **smaller than** `obj2`.
 * * **> 0**: If `obj1` is **greater than** `obj2`.
 *
 * @param obj1 Object to be compared.
 * @param obj2 Object to be compared.
 * @returns Result of the comparison.
 */
export function compare(obj1: unknown, obj2: unknown): number {
  if (typeof obj1 === 'undefined' && typeof obj2 === 'undefined') {
    return 0;
  }

  if (typeof obj1 === 'symbol' || typeof obj2 === 'symbol') {
    throw new TypeError('Cannot compare symbols.');
  }

  if (typeof obj1 === 'function' || typeof obj2 === 'function') {
    throw new TypeError('Cannot compare functions.');
  }

  if (
    (typeof obj1 === 'bigint' && typeof obj2 === 'bigint') ||
    (typeof obj1 === 'boolean' && typeof obj2 === 'boolean') ||
    (typeof obj1 === 'number' && typeof obj2 === 'number') ||
    (typeof obj1 === 'string' && typeof obj2 === 'string')
  ) {
    if (typeof obj1 === 'number' && typeof obj2 === 'number') {
      if (Number.isNaN(obj1) && Number.isNaN(obj2)) {
        return 0;
      }

      if ((Number.isNaN(obj1) && !Number.isNaN(obj2)) || (!Number.isNaN(obj1) && Number.isNaN(obj2))) {
        throw new TypeError('Cannot compare a number with a NaN.');
      }
    }

    return obj1 === obj2 ? 0 : obj1 < obj2 ? -1 : 1;
  }

  // TODO: Check if there are more "primitive" constructors.
  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    if (obj1 === null && obj2 === null) {
      return 0;
    }

    if (Buffer.isBuffer(obj1) && Buffer.isBuffer(obj2)) {
      return Buffer.compare(obj1, obj2);
    }

    if (obj1 instanceof Date && obj2 instanceof Date) {
      return obj1.getTime() === obj2.getTime() ? 0 : obj1 < obj2 ? -1 : 1;
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

    if (obj1 !== null && obj2 !== null && (obj1 instanceof obj2.constructor || obj2 instanceof obj1.constructor)) {
      if (typeof Reflect.get(obj1, 'compare') !== 'function') {
        throw new TypeError('Missing method "compare()" on parameter "obj1".');
      }

      if (typeof Reflect.get(obj2, 'compare') !== 'function') {
        throw new TypeError('Missing method "compare()" on parameter "obj2".');
      }

      return (<Comparable<unknown>>obj1).compare(obj2);
    }
  }

  throw new TypeError('Cannot compare objects of different types.');
}
