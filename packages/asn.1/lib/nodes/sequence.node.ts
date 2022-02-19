import { Optional } from '@guarani/types';

import { Class } from '../class';
import { UnsupportedMethodException } from '../exceptions/unsupported-method.exception';
import { Encoding } from '../encoding';
import { Type } from '../type';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Sequence Node represents an ordered collection of one or more Nodes.
 */
export class SequenceNode extends Node<Node[]> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Type;

  /**
   * Initializes a Sequence Node containing the provided Nodes as its elements.
   *
   * @param data Nodes that denote the structure of the Sequence.
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
  public constructor(data: Node[], options: Optional<NodeOptions> = {}) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new TypeError('Invalid parameter "data".');
    }

    if (data.some((node) => !(node instanceof Node))) {
      throw new TypeError('One or more elements are not instances of Node.');
    }

    if (options.encoding !== undefined && options.encoding !== Encoding.Constructed) {
      throw new UnsupportedMethodException('The Sequence Type only supports the Constructed Encoding.');
    }

    options.class ??= Class.Universal;
    options.encoding = Encoding.Constructed;

    super(data, options);

    this.type = Type.Sequence;
  }
}
