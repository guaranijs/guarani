import { Primitives } from '@guarani/utils'

import { encodeLength } from '../../_utils'
import { Node } from './node'

export class Integer extends Node {
  public static tag: number = 0x02

  public constructor (integer: number | bigint) {
    super()

    const buffer = Primitives.toBuffer(integer)
    const data = (buffer[0] & 0x80) ? Buffer.from([0x00, ...buffer]) : buffer
    const length = encodeLength(data.length)

    this.value = Buffer.concat([Primitives.toBuffer(Integer.tag), length, data])
  }
}
