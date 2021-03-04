import { Primitives } from '@guarani/utils'
import { encodeLength } from '../../_utils'
import { Node } from './node'

export class OctetString extends Node {
  public static tag: number = 0x04

  public constructor (value: Buffer) {
    super()

    this.value = Buffer.concat([
      Primitives.toBuffer(OctetString.tag),
      encodeLength(value.length),
      value
    ])
  }
}
