import { Primitives } from '@guarani/utils'
import { encodeLength } from '../../_utils'

import { Node } from './node'

export class Sequence extends Node {
  public static tag: number = 0x30
  private _nodes: Node[]

  public constructor (...nodes: Node[]) {
    super()

    this.value = Buffer.concat([
      Primitives.toBuffer(Sequence.tag),
      encodeLength(nodes.reduce<number>((length, node) => (length += node.length), 0)),
      ...nodes.map(node => node.encode())
    ])
    this._nodes = nodes
  }

  public get nodes (): Node[] {
    return this._nodes
  }
}
