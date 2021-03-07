import { Primitives } from '@guarani/utils'
import { encodeLength } from '../../_utils'
import { Node } from './node'

export class BitString extends Node {
  protected value: Buffer

  public constructor (value: Buffer) {
    super()

    // TODO: Check if, when the value of bin(value) % 8 is 0, we need to add the padding.
    this.value = Buffer.concat([
      Primitives.toBuffer(0x03),
      encodeLength(value.length + 1),
      Primitives.toBuffer(0x00),
      value
    ])
  }
}
