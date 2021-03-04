import { Node } from './nodes'

export class ASN1 {
  private value: Buffer
  private _nodes: Node[]

  public constructor (...nodes: Node[]) {
    this.value = Buffer.concat(nodes.map(node => node.encode()))
    this._nodes = nodes
  }

  public encode (): Buffer {
    return this.value
  }

  public get length (): number {
    return this.value.length
  }

  public get nodes (): Node[] {
    return this._nodes
  }
}
