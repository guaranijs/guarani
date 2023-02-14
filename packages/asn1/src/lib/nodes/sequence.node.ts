import { Asn1Class } from '../asn1-class.enum';
import { Asn1Encoding } from '../asn1-encoding.enum';
import { Asn1Type } from '../asn1-type.enum';
import { UnsupportedEncodingException } from '../exceptions/unsupported-encoding.exception';
import { Node } from './node';
import { NodeOptions } from './node.options';

/**
 * The Sequence Node represents an ordered collection of one or more Nodes.
 */
export class SequenceNode extends Node<Node[]> {
  /**
   * Type Identifier of the Node.
   */
  public readonly type: Asn1Type;

  /**
   * Initializes a Sequence Node containing the provided Nodes as its elements.
   *
   * @param data Nodes that denote the structure of the Sequence.
   * @param options Optional parameters to customize the Node.
   */
  public constructor(data: Node[], options: NodeOptions = {}) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new TypeError('Invalid parameter "data".');
    }

    if (data.some((node) => !(node instanceof Node))) {
      throw new TypeError('One or more elements are not instances of Node.');
    }

    if (options.encoding !== undefined && options.encoding !== Asn1Encoding.Constructed) {
      throw new UnsupportedEncodingException('The Sequence Type only supports the Constructed Encoding.');
    }

    options.class ??= Asn1Class.Universal;
    options.encoding = Asn1Encoding.Constructed;

    super(data, options);

    this.type = Asn1Type.Sequence;
  }
}
