type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex'

/**
 * Decodes a Buffer back to its original integer.
 * Note: It assumes that the Buffer represents an integer.
 *
 * @param {string} data Base64-url encoded string.
 * @returns Integer represented by the provided Buffer.
 */
function bufferToInt (data: Buffer): bigint {
  if (data == null) return null

  const strRepr = data.reduce((res, item) => {
    let n = item.toString(16)
    if (n.length === 1) n = `0${n}`
    return res.concat(n)
  }, '')

  return BigInt(`0x${strRepr || '00'}`)
}

/**
 * Encodes an integer as a Buffer.
 *
 * @param {bigint | number} integer Integer to be encoded.
 * @returns Buffer representation of the integer.
 */
function intToBuffer (integer: bigint | number): Buffer {
  if (typeof integer !== 'bigint' && typeof integer !== 'number') {
    throw new TypeError('The provided data is not a valid integer representation.')
  }

  const len = Math.floor((integer.toString(2).length + 7) / 8)
  const arr = new Uint8Array(len)

  let hexRepr = integer.toString(16)

  if (hexRepr.length % 2 === 1) hexRepr = `0${hexRepr}`

  for (let i = 0; i < len; i++) {
    arr[i] = Number.parseInt(hexRepr.slice(2 * i, 2 * (i + 1)), 16)
  }

  return Buffer.from(arr)
}

/**
 * Reverses a Buffer object back to a primitive type.
 *
 * @param {Buffer} buffer Buffer to be reversed back to a primitive type.
 */
export function fromBuffer (buffer: Buffer, format: 'string' | 'integer', encoding?: BufferEncoding): unknown {
  if (!Buffer.isBuffer(buffer) || buffer == null) return null
  if (format === 'string') return buffer.toString(encoding)
  if (format === 'integer') return bufferToInt(buffer)
}

/**
 * Converts the provided data into a Buffer object.
 *
 * @param {*} data Data to be converted.
 * @throws TypeError: The data provided is not supported.
 * @returns Resulting Buffer object.
 */
export function toBuffer (data: unknown): Buffer {
  if (Buffer.isBuffer(data) || data == null) return data as Buffer
  if (typeof data === 'string') return Buffer.from(data, 'utf8')
  if (typeof data === 'bigint' || typeof data === 'number') return intToBuffer(data)
  throw new TypeError('The provided data is in an unsupported format.')
}
