import { Primitives } from '@guarani/utils'

import { encodeLength } from '../_utils'
import { Node } from './node'

/**
 * The Sequence type represents an ordered collection of one or more types.
 *
 * TAG Number: 0x30
 */
export class Sequence extends Node {
  private nodes: Node[]

  /**
   * Initializes a Sequence type containing the provided nodes as its elements.
   *
   * @param nodes - Nodes that denote the structure of the Sequence.
   *
   * @example
   * const pkcs1RsaPublicKey = new Sequence(
   *   new Integer(modulus),
   *   new Integer(publicExponent)
   * )
   *
   * pkcs1RsaPublicKey.encode() // <Buffer 30 82 01 7a ...>
   */
  public constructor(...nodes: Node[]) {
    super()

    if (nodes.some(node => !(node instanceof Node)))
      throw new TypeError('One or more parameters are not instances of Node.')

    this.nodes = nodes
  }

  /**
   * Encodes the provided value into a Sequence type Buffer.
   *
   * @returns Encoded data enveloped in an Integer type.
   *
   * @example
   * const seq = new Sequence(new Integer(65537))
   * seq.encode() // <Buffer 30 05 02 03 01 00 01>
   */
  public encode(): Buffer {
    return Buffer.concat([
      Primitives.toBuffer(0x30),
      encodeLength(
        this.nodes.reduce<number>(
          (length, node) => (length += node.encode().length),
          0
        )
      ),
      ...this.nodes.map(node => node.encode())
    ])
  }
}
