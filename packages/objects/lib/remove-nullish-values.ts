/**
 * Removes nullish values from the properties
 * of an object or an array of objects.
 *
 * @param data Object or array of objects to be cleansed.
 * @returns Object or array of objects without nullish values.
 */
export function removeNullishValues<T>(data: T): T {
  if (data == null || typeof data !== 'object') {
    return data;
  }

  return Object.entries(data).reduce((result, [key, value]) => {
    if (value == null) {
      return result;
    }

    if (Array.isArray(value)) {
      const mappedArray = value.filter((e) => !(e == null)).map((e) => removeNullishValues<T>(e));

      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: mappedArray,
        writable: true,
      });
    } else if (typeof value === 'object') {
      Object.defineProperty(result, key, {
        configurable: true,
        enumerable: true,
        value: removeNullishValues<T>(value),
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
