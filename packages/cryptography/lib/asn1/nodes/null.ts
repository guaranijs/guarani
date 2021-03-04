import { Primitives } from '@guarani/utils'
import { Node } from './node'

export class Null extends Node {
  public static tag: number = 0x05

  public constructor () {
    super()
    this.value = Buffer.concat([Primitives.toBuffer(Null.tag), Primitives.toBuffer(0x00)])
  }
}
