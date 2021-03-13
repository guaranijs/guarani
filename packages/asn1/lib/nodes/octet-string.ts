import { Primitives } from '@guarani/utils'

import { encodeLength } from '../_utils'
import { Node } from './node'

/**
 * The OctetString type denotes an arbitrary sequence of octets.
 * It is used to represent a sequence of bytes represented in hex.
 *
 * TAG Number: 0x04
 */
export class OctetString extends Node {
  private value: Buffer

  public constructor(value: Buffer) {
    super()

    if (!Buffer.isBuffer(value))
      throw new TypeError('Invalid parameter "value".')

    this.value = value
  }

  /**
   * Encodes the provided value into an OctetString type Buffer.
   *
   * @returns Encoded data enveloped in an OctetString type.
   *
   * @example
   * const octstr = new OctetString(Buffer.from([0x02, 0x0d, 0x4f, 0x9e, 0xb3]))
   * octstr.encode() // <Buffer 04 05 02 0d 4f 9e b3>
   */
  public encode(): Buffer {
    return Buffer.concat([
      Primitives.toBuffer(0x04),
      encodeLength(this.value.length),
      this.value
    ])
  }
}
