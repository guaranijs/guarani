import { Primitives } from '@guarani/utils'

import { Node } from './node'

/**
 * Representation of the NULL value in the ASN.1 type notation.
 *
 * TAG Number: 0x05
 */
export class Null extends Node {
  /**
   * Checks whether the provided buffer is a Null.
   *
   * @param buffer - Buffer to be checked.
   * @returns Whether or not the buffer is a Null.
   */
  public static isNull(buffer: Buffer): boolean {
    return buffer[0] === 0x05
  }

  /**
   * Encodes the Null type Buffer.
   *
   * @returns Encoded data enveloped in an Integer type.
   *
   * @example
   * const nullValue = new Null()
   * nullValue.encode() // <Buffer 05 00>
   */
  public encode(): Buffer {
    return Buffer.concat([Primitives.toBuffer(0x05), Primitives.toBuffer(0x00)])
  }
}
