/**
 * Removes undefined values from the properties of an object or an array of objects.
 *
 * @param data Object or array of objects to be cleansed.
 * @returns Object or array of objects without undefined values.
 */
export function removeUndefined<T>(data: T): T {
  if (data == null || typeof data !== 'object') {
    return data;
  }

  return Object.entries(data).reduce((result, [key, value]) => {
    if (value === undefined) {
      return result;
    }

    if (Array.isArray(value)) {
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: value.filter((e) => e !== undefined).map((e) => removeUndefined<T>(e)),
        writable: true,
      });
    } else if (typeof value === 'object') {
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: removeUndefined<T>(value),
        writable: true,
      });
    } else {
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value,
        writable: true,
      });
    }

    return result;
  }, <T>{});
}

/**
 * Checks if the provided data is a Plain Javascript Object.
 *
 * @param data Object to be checked.
 * @returns The provided data is a Plain Javascript Object.
 */
export function isPlainObject(data: unknown): data is object {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(data);

  return proto === null || proto === Object.prototype;
}
