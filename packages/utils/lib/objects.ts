/**
 * Removes nullish values from the properties of an object or an array of objects.
 *
 * @param {*} data Object or array of objects to be cleansed.
 * @returns Object or array of objects without nullish values.
 */
export function removeNullishValues (data: unknown): unknown {
  if (data == null || typeof data !== 'object') return data

  return Object.entries(data).reduce((r, [k, v]) => {
    if (v == null) return r

    if (Array.isArray(v)) r[k] = v.filter(e => !(e == null)).map(e => removeNullishValues(e))
    else if (typeof v === 'object') r[k] = removeNullishValues(v)
    else r[k] = v

    return r
  }, {})
}

/**
 * Reverses the entries of an object.
 *
 * @param {unknown} data Object that will have its entries reversed.
 * @returns Object with its entries reversed.
 */
export function reverseEntries (data: unknown): unknown {
  return Object.entries(data).reduce((p, [k, v]) => { p[v] = k; return p }, {})
}
