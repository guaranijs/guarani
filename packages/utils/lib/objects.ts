/**
 * Provides tools to work with objects and their properties.
 *
 * @module Objects
 */

/**
 * Removes nullish values from the properties
 * of an object or an array of objects.
 *
 * @param data - Object or array of objects to be cleansed.
 * @returns Object or array of objects without nullish values.
 */
export function removeNullishValues(data: unknown): unknown {
  if (data == null || typeof data !== 'object') return data

  return Object.entries(data).reduce((r, [k, v]) => {
    if (v == null) return r

    if (Array.isArray(v))
      r[k] = v.filter(e => !(e == null)).map(e => removeNullishValues(e))
    else if (typeof v === 'object') r[k] = removeNullishValues(v)
    else r[k] = v

    return r
  }, {})
}

/**
 * Options to enhance the comparison of equals().
 */
interface EqualsOptions {
  /**
   * Defines whether all arrays must be sorted before comparison.
   */
  sortArrays?: boolean
}

/**
 * Perfoms a deep comparison between the properties of two objects.
 *
 * @param first - First object.
 * @param last - Last object.
 * @param options - Defines the options to enhance the comparison.
 * @returns Boolean informing whether or not the two objects are equal.
 */
export function equals(
  first: unknown,
  last: unknown,
  options: EqualsOptions = {}
): boolean {
  if (first === undefined && last === undefined) return true

  if (first === null && last === null) return true

  if (
    (typeof first === 'bigint' && typeof last === 'bigint') ||
    (typeof first === 'boolean' && typeof last === 'boolean') ||
    (typeof first === 'number' && typeof last === 'number') ||
    (typeof first === 'string' && typeof last === 'string')
  )
    return first === last

  if (Buffer.isBuffer(first) && Buffer.isBuffer(last))
    return Buffer.compare(first, last) === 0

  if (Array.isArray(first) && Array.isArray(last)) {
    if (first.length !== last.length) return false

    if (options.sortArrays) {
      first.sort()
      last.sort()
    }

    for (let i = 0; i < first.length; i++) {
      if (!equals(first[i], last[i], options)) {
        return false
      }
    }

    return true
  }

  const firstKeys = Object.keys(first).sort()
  const lastKeys = Object.keys(last)

  if (firstKeys.length !== lastKeys.length) return false

  for (const key of firstKeys) {
    if (!equals(first[key], last[key], options)) {
      return false
    }
  }

  return true
}
