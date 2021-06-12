import { Primitives } from '@guarani/utils'

import { Node } from './node'

/**
 * The Bool type denotes a boolean (you don't say).
 *
 * TAG Number: 0x01
 */
export class Bool extends Node {
  /**
   * Value representing the boolean.
   */
  private readonly value: boolean

  /**
   * Instantiates a new Bool object based on the provided value.
   *
   * @param value - Boolean value.
   */
  public constructor(value: boolean) {
    super()

    if (typeof value !== 'boolean') {
      throw new TypeError('Invalid parameter "value".')
    }

    this.value = value
  }

  /**
   * Checks whether the provided buffer is a Bool.
   *
   * @param buffer - Buffer to be checked.
   * @returns Whether or not the buffer is a Bool.
   */
  public static isBool(buffer: Buffer): boolean {
    return buffer[0] === 0x01
  }

  /**
   * Encodes the provided value into a Bool type Buffer.
   *
   * @returns Encoded data enveloped in a Bool type.
   *
   * @example
   * const trueValue = new Bool(true)
   * trueValue.encode() // <Buffer 01 01 01>
   *
   * const falseValue = new Bool(false)
   * falseValue.encode() // <Buffer 01 01 00>
   */
  public encode(): Buffer {
    return Buffer.concat([
      Primitives.toBuffer(0x01),
      Primitives.toBuffer(0x01),
      this.value ? Primitives.toBuffer(0x01) : Primitives.toBuffer(0x00)
    ])
  }
}
