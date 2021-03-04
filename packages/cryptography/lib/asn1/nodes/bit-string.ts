import { Primitives } from '@guarani/utils'
import { encodeLength } from '../../_utils'
import { Node } from './node'

export class BitString extends Node {
  public static tag: number = 0x03

  public constructor (value: Buffer) {
    super()

    // TODO: Check if, when the value of bin(value) % 8 is 0, we need to add the padding.
    this.value = Buffer.concat([
      Primitives.toBuffer(BitString.tag),
      encodeLength(value.length + 1),
      Primitives.toBuffer(0x00),
      value
    ])
  }
}
