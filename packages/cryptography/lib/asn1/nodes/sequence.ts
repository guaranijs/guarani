import { Primitives } from '@guarani/utils'
import { encodeLength } from '../../_utils'

import { Node } from './node'

export class Sequence extends Node {
  protected value: Buffer
  private _nodes: Node[]

  public constructor (...nodes: Node[]) {
    super()

    this.value = Buffer.concat([
      Primitives.toBuffer(0x30),
      encodeLength(nodes.reduce<number>((length, node) => (length += node.length), 0)),
      ...nodes.map(node => node.encode())
    ])
    this._nodes = nodes
  }

  public get nodes (): Node[] {
    return this._nodes
  }
}
