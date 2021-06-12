import { Primitives } from '@guarani/utils'

import { encodeLength } from '../_utils'
import { Node } from './node'

/**
 * The ObjectId type denotes a sequence of integer components that identifies
 * an algorithm, a type, an authority that defines other object identifiers,
 * or any entity that provides a custom implementation of an object.
 *
 * It is usually represented by a string separated by dots (e.g. 1.2.840.113549)
 * or by a list of integers (e.g. { 1 2 840 113549 }).
 *
 * TAG Number: 0x06
 */
export class ObjectId extends Node {
  /**
   * Array of numbers representing the ObjectId.
   */
  private readonly values: number[]

  /**
   * Parses an integer string separated by dots into an ObjectId.
   *
   * @param value - An string of integers separated by dots.
   *
   * @example
   * const oid = new ObjectId('1.2.840.113549')
   * oid.encode() // <Buffer 06 06 2a 86 48 86 f7 0d>
   */
  public constructor(value: string)

  /**
   * Parses an array of integers into an ObjectId.
   *
   * @param value - An array of integers.
   *
   * @example
   * const oid = new ObjectId([1, 2, 840, 113549])
   * oid.encode() // <Buffer 06 06 2a 86 48 86 f7 0d>
   */
  public constructor(value: number[])

  public constructor(value: string | number[]) {
    super()

    if (typeof value !== 'string' && !Array.isArray(value)) {
      throw new TypeError('Invalid parameter "value".')
    }

    if (Array.isArray(value) && value.some(e => typeof e !== 'number')) {
      throw new TypeError('Invalid parameter "value".')
    }

    const values =
      typeof value === 'string'
        ? value.split(/[\s.]+/g).map(e => Number.parseInt(e))
        : value

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

    this.values = values
  }

  /**
   * Checks whether the provided buffer is an ObjectId.
   *
   * @param buffer - Buffer to be checked.
   * @returns Whether or not the buffer is an ObjectId.
   */
  public static isObjectId(buffer: Buffer): boolean {
    return buffer[0] === 0x06
  }

  /**
   * Encodes the provided value into an ObjectId type Buffer.
   *
   * @returns Encoded data enveloped in an ObjectId type.
   *
   * @example
   * const oid = new ObjectId('1.2.840.113549.1.1.1')
   * oid.encode() // <Buffer 06 09 2a 86 48 86 f7 0d 01 01 01>
   */
  public encode(): Buffer {
    const firstByte = Primitives.toBuffer(40 * this.values[0] + this.values[1])
    const bytes: Buffer[] = []

    for (let i = this.values.length - 1; i > 1; i--) {
      let element = this.values[i]

      bytes.push(Primitives.toBuffer(element & 0x7f))

      while ((element >>>= 7) > 0) {
        bytes.push(Primitives.toBuffer(0x80 | (element & 0x7f)))
      }
    }

    const buffer = Buffer.concat([firstByte, ...bytes.reverse()])
    const length = encodeLength(buffer.length)

    return Buffer.concat([Primitives.toBuffer(0x06), length, buffer])
  }
}
