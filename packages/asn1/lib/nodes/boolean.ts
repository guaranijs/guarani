import { Primitives } from '@guarani/utils'

import { Node } from './node'

/**
 * The Boolean type denotes a boolean (you don't say).
 *
 * TAG Number: 0x01
 */
export class Boolean extends Node {
  private value: boolean

  public constructor(value: boolean) {
    super()

    if (typeof value !== 'boolean')
      throw new TypeError('Invalid parameter "value".')

    this.value = value
  }

  /**
   * Encodes the provided value into a Boolean type Buffer.
   *
   * @returns Encoded data enveloped in a Boolean type.
   *
   * @example
   * const trueValue = new Boolean(true)
   * trueValue.encode() // <Buffer 01 01 01>
   *
   * const falseValue = new Boolean(false)
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
