import { Primitives } from '@guarani/utils'
import { Node } from './node'

export class Boolean extends Node {
  protected value: Buffer

  public constructor (value: any) {
    super()

    const buffer = value ? Primitives.toBuffer(0x01) : Primitives.toBuffer(0x00)

    this.value = Buffer.concat([
      Primitives.toBuffer(0x01),
      Primitives.toBuffer(0x01),
      buffer
    ])
  }
}
