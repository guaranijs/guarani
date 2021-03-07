import { Primitives } from '@guarani/utils'
import { Node } from './node'

export class Null extends Node {
  protected value: Buffer

  public constructor () {
    super()
    this.value = Buffer.concat([Primitives.toBuffer(0x05), Primitives.toBuffer(0x00)])
  }
}
