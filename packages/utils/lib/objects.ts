/**
 * Removes nullish values from an the properties of an object or an array of objects.
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
