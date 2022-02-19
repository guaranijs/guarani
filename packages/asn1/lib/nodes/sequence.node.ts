import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Method } from '../method';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Sequence Node represents an ordered collection of one or more Nodes.
 */
export class SequenceNode extends Node<Node<unknown>[]> {
  /**
   * Type Identifier of the Node.
   */
  protected static readonly type: Type = Type.Sequence;

  /**
   * Initializes a Sequence Node containing the provided Nodes as its elements.
   *
   * @param value Nodes that denote the structure of the Sequence.
   * @param options Optional parameters to customize the Node.
   *
   * @example
   * const pkcs1RsaPublicKey = new SequenceNode(
   *   new IntegerNode(modulus),
   *   new IntegerNode(publicExponent)
   * )
   *
   * pkcs1RsaPublicKey.encode() // <Buffer 30 82 01 7a ...>
   */
  public constructor(value: Node<unknown>[], options: Optional<NodeOptions> = {}) {
    if (!Array.isArray(value)) {
      throw new TypeError('Invalid parameter "value".');
    }

    if (value.some((node) => !(node instanceof Node))) {
      throw new TypeError('One or more parameters are not instances of Node.');
    }

    if (typeof options.method !== 'undefined' && options.method !== Method.Constructed) {
      throw new Error('Unsupported option "method".');
    }

    options.class ??= Class.Universal;
    options.method = Method.Constructed;

    super(value, options);
  }

  /**
   * Encodes the Sequence Node into a Buffer object.
   *
   * @example
   * const seq = new SequenceNode(new IntegerNode(65537))
   * seq.encode() // <Buffer 30 05 02 03 01 00 01>
   */
  protected encodeData(): Buffer {
    const encodedNodes = this.value.map((node) => node.encode());

    return Buffer.concat(encodedNodes);
  }
}
