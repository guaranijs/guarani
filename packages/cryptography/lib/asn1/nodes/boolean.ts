import { Primitives } from '@guarani/utils'
import { Node } from './node'

export class Boolean extends Node {
  public static tag: number = 0x01

  public constructor (value: any) {
    super()

    const buffer = value ? Primitives.toBuffer(0x01) : Primitives.toBuffer(0x00)

    this.value = Buffer.concat([
      Primitives.toBuffer(Boolean.tag),
      Primitives.toBuffer(0x01),
      buffer
    ])
  }
}
