import { toBuffer } from '@guarani/utils'

import { encodeLength } from '../_utils'
import { Node } from './node'

/**
 * The Integer type denotes the representation of a signed integer.
 *
 * TAG Number: 0x02
 *
 * Some applications might require the integer to be unsigned,
 * or for it to be `{ x ∣ x ∈ N* }`. The conversion to and from the
 * required signaling of the integer is left to the application.
 */
export class Integer extends Node {
  /**
   * Value representing the integer.
   */
  private readonly value: bigint

  /**
   * Instantiates a new Integer object based on the provided value.
   *
   * @param value - Integer value.
   */
  public constructor(value: number | bigint) {
    super()

    this.value = BigInt(value)
  }

  /**
   * Checks whether the provided buffer is an Integer.
   *
   * @param buffer - Buffer to be checked.
   * @returns Whether or not the buffer is an Integer.
   */
  public static isInteger(buffer: Buffer): boolean {
    return buffer[0] === 0x02
  }

  /**
   * Encodes the provided value into an Integer type Buffer.
   *
   * @returns Encoded data enveloped in an Integer type.
   *
   * @example
   * const integer = new Integer(65537)
   * integer.encode() // <Buffer 02 03 01 00 01>
   */
  public encode(): Buffer {
    const buffer = toBuffer(this.value)
    const data = buffer[0] & 0x80 ? Buffer.from([0x00, ...buffer]) : buffer
    const length = encodeLength(data.length)

    return Buffer.concat([toBuffer(0x02), length, data])
  }
}
