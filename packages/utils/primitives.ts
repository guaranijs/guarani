/**
 * Decodes a Buffer back to its original integer.
 * Note: It assumes that the Buffer represents an integer.
 *
 * @param data Buffer representation of an integer.
 * @returns Integer represented by the provided Buffer.
 */
function bufferToInt(data: Buffer): bigint {
  if (!Buffer.isBuffer(data)) {
    throw new TypeError('Invalid parameter "data".')
  }

  const strRepr = data.reduce((res, item) => {
    let n = item.toString(16)

    if (n.length === 1) {
      n = `0${n}`
    }

    return res.concat(n)
  }, '')

  return BigInt(`0x${strRepr || '00'}`)
}

/**
 * Encodes an integer as a Buffer.
 *
 * @param integer Integer to be encoded.
 * @returns Buffer representation of the integer.
 */
function intToBuffer(integer: bigint | number): Buffer {
  const data = BigInt(integer)

  const len = Math.floor((data.toString(2).length + 7) / 8)
  const arr = new Uint8Array(len)

  let hexRepr = data.toString(16)

  if (hexRepr.length % 2 === 1) {
    hexRepr = `0${hexRepr}`
  }

  for (let i = 0; i < len; i++) {
    arr[i] = Number.parseInt(hexRepr.slice(2 * i, 2 * (i + 1)), 16)
  }

  return Buffer.from(arr)
}

/**
 * Reverses a Buffer object back to an integer.
 *
 * @param buffer Buffer to be reversed back to an integer.
 * @param format Defines the output format to an integer.
 * @returns Integer converted from the provided Buffer object.
 */
export function fromBuffer(buffer: Buffer, format: BigIntConstructor): bigint

/**
 * Reverses a Buffer object back to an integer.
 *
 * @param buffer Buffer to be reversed back to an integer.
 * @param format Defines the output format to an integer.
 * @returns Integer converted from the provided Buffer object.
 */
export function fromBuffer(buffer: Buffer, format: NumberConstructor): number

/**
 * Reverses a Buffer object back to a string.
 *
 * @param buffer Buffer to be reversed back to a string.
 * @param format Defines the output format to a string.
 * @param encoding Optional encoding format for the string output.
 * @returns String converted from the provided Buffer object.
 */
export function fromBuffer(
  buffer: Buffer,
  format: StringConstructor,
  encoding?: globalThis.BufferEncoding
): string

/**
 * Reverses a Buffer object back into its original type.
 *
 * @param buffer Buffer to be reversed back into its original type.
 * @param format Indicates the original type of the data.
 * @param encoding Optional encoding format for the String output.
 * @returns Object converted from the provided Buffer object.
 */
export function fromBuffer(
  buffer: Buffer,
  format: BigIntConstructor | NumberConstructor | StringConstructor,
  encoding?: globalThis.BufferEncoding
): string | number | bigint {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Invalid parameter "buffer".')
  }

  if (format === BigInt) {
    return bufferToInt(buffer)
  }

  if (format === Number) {
    return Number.parseInt(bufferToInt(buffer).toString())
  }

  if (format === String) {
    return buffer.toString(encoding)
  }

  throw new TypeError('Invalid parameter "format".')
}

/**
 * Converts the provided string into a Buffer object.
 *
 * @param data String to be converted.
 * @throws {TypeError} The data provided is not supported.
 * @returns Resulting Buffer object.
 */
export function toBuffer(data: string): Buffer

/**
 * Converts the provided integer into a Buffer object.
 *
 * @param data Integer to be converted.
 * @throws {TypeError} The data provided is not supported.
 * @returns Resulting Buffer object.
 */
export function toBuffer(data: number | bigint): Buffer

/**
 * Converts the provided data into a Buffer object.
 *
 * @param data Data to be converted.
 * @throws {TypeError} The data provided is not supported.
 * @returns Resulting Buffer object.
 */
export function toBuffer(data: string | number | bigint): Buffer {
  if (typeof data === 'string') {
    return Buffer.from(data, 'utf8')
  }

  if (typeof data === 'bigint' || typeof data === 'number') {
    return intToBuffer(data)
  }

  throw new TypeError('The provided data is in an unsupported format.')
}
