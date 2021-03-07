import { Primitives } from '@guarani/utils'
import { encodeLength } from '../../_utils'
import { Node } from './node'

export class OctetString extends Node {
  protected value: Buffer

  public constructor (value: Buffer) {
    super()

    this.value = Buffer.concat([
      Primitives.toBuffer(0x04),
      encodeLength(value.length),
      value
    ])
  }
}
