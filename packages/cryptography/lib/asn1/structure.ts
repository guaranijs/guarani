import { Primitives } from '@guarani/utils'

import { Tags } from './constants'

/**
 * This function encodes the length of a primitive type using either
 * the Short Form or the Long Form into an unsigned integer buffer.
 *
 * The Short Form is used when the length of the value is less than 128.
 * The bit 8 is set to "0" and the rest of the bits define the actual length of the value.
 *
 * The Long Form is used when the length of the value is greater than or equal to 128.
 * The first byte of the length defines the number of octets that represent the actual length.
 * Its bit 8 is set to "1" and the rest of the bits define the number of octets that
 * will be used to represent the length of the value.
 * The second and following octets represent the actual length of the value,
 * base 256, most significant digit first.
 *
 * @param length Length of the value in decimal.
 */
export function encodeLength (length: number): Buffer {
  if (length < 0x80) return Primitives.toBuffer(length)
  const asBuffer = Primitives.toBuffer(length)
  if (asBuffer.length > 127) throw new RangeError('Unsupported large number.')
  return Buffer.from([0x80 + asBuffer.length, ...asBuffer])
}

export class ASN1 {
  private _length: number
  private _elements: Buffer[]

  constructor () {
    this._length = 0
    this._elements = []
  }

  public get length () {
    return this._length
  }

  public get elements () {
    return this._elements
  }

  public boolean (value: boolean): void {
    const v = value ? Primitives.toBuffer(0x01) : Primitives.toBuffer(0x00)
    this._elements.push(Tags.BOOLEAN, Primitives.toBuffer(0x01), v)
    this._length += 3
  }

  public oid (value: string): void {
    if (typeof value !== 'string' || !value) {
      throw new TypeError('The OID MUST be a string separated by dots or spaces.')
    }

    const values = value.split(/[\s.]+/g).map(e => Number.parseInt(e))

    if (values.length < 2) {
      throw new Error('There MUST be AT LEAST two values.')
    }

    if (values.some(e => e < 0)) {
      throw new Error('The OID CANNOT have negative integers.')
    }

    if (![0, 1, 2].includes(values[0])) {
      throw new Error('The first value MUST be between 0 and 2.')
    }

    if (values[0] < 2 && values[1] >= 40) {
      throw new Error('The second value is outside of range.')
    }

    const firstByte = Primitives.toBuffer(40 * values[0] + values[1])
    const bytes: Buffer[] = []

    for (let i = values.length - 1; i > 1; i--) {
      let element = values[i]
      bytes.push(Primitives.toBuffer(element & 0x7f))
      while ((element >>= 7) > 0) bytes.push(Primitives.toBuffer(0x80 | (element & 0x7f)))
    }

    const buffer = Buffer.concat([firstByte, ...bytes.reverse()])
    const length = encodeLength(buffer.length)

    this._elements.push(Tags.OBJECTID, length, buffer)
    this._length += 1 + length.length + buffer.length
  }

  /**
   * Adds an unsigned integer to the encoder.
   *
   * @param {number | bigint} value Integer to be added to the encoder.
   */
  public integer (value: number | bigint): void {
    const buffer = Primitives.toBuffer(value)
    const int = buffer[0] & 0x80 ? Buffer.from([0x00, ...buffer]) : Buffer.from(buffer)
    const length = encodeLength(int.length)

    this._elements.push(Tags.INTEGER, length, int)
    this._length += 1 + length.length + int.length
  }

  // TODO: Thoroughly validate this.
  public bitString (value: Buffer): void {
    const length = encodeLength(value.length + 1)
    this._elements.push(Tags.BITSTRING, length, Tags.ZERO, value)
    this._length += 1 + length.length + 1 + value.length
  }

  public octString (value: Buffer): void {
    const length = encodeLength(value.length)
    this._elements.push(Tags.OCTETSTRING, length, value)
    this._length += 1 + length.length + value.length
  }

  public null (): void {
    this._elements.push(Tags.NULL, Tags.ZERO)
    this._length += 2
  }

  public push (data: Buffer) {
    this._elements.push(data)
    this._length += data.length
  }

  public sequence (): void {
    const buffer = new ArrayBuffer(1 + encodeLength(this._length).length + this._length)
    const elements = new Uint8Array(buffer)
    const encLen = encodeLength(this._length)
    let i = 0

    elements.set(Tags.SEQUENCE, i)
    i += 1
    elements.set(encLen, i)
    i += encLen.length

    this._elements.forEach((element) => {
      if (element.length === 1) elements.set(element, i++)
      else element.forEach((byte) => elements.set(Primitives.toBuffer(byte), i++))
    })

    this._elements = []
    elements.forEach(element => this._elements.push(Primitives.toBuffer(element)))

    this._length = this._elements.length
  }
}
