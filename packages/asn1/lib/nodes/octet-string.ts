import { toBuffer } from '@guarani/utils/primitives'

import { encodeLength } from '../_utils'
import { Node } from './node'

/**
 * The OctetString type denotes an arbitrary sequence of octets.
 * It is used to represent a sequence of bytes represented in hex.
 *
 * TAG Number: 0x04
 */
export class OctetString extends Node {
  /**
   * Value representing the octetstring.
   */
  private readonly value: Buffer

  /**
   * Instantiates a new OctetString object based on the provided value.
   *
   * @param value - Buffer representation of the OctetString.
   */
  public constructor(value: Buffer) {
    super()

    if (!Buffer.isBuffer(value)) {
      throw new TypeError('Invalid parameter "value".')
    }

    this.value = value
  }

  /**
   * Checks whether the provided buffer is an OctetString.
   *
   * @param buffer - Buffer to be checked.
   * @returns Whether or not the buffer is an OctetString.
   */
  public static isOctetString(buffer: Buffer): boolean {
    return buffer[0] === 0x04
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
      toBuffer(0x04),
      encodeLength(this.value.length),
      this.value
    ])
  }
}
