import { EncodingException } from '../exceptions/encoding.exception';
import { InternalNodeElement } from '../metadata/elements/internal-node.element';
import { RootNodeElement } from '../metadata/elements/root-node.element';
import { Node } from '../nodes/node';
import { Type } from '../type';
import { Encoder } from './encoder';

export class BerEncoder extends Encoder<Buffer> {
  /**
   * Resolves an Internal Node Element into a Node instance.
   *
   * @param data Data to be resolved.
   * @param element Internal Node Element representing a property of the data.
   * @returns Resolved Node.
   */
  protected resolveInternalNodeElement(data: object, element: InternalNodeElement): Node {
    let attribute = <object>Reflect.get(data, element.propertyKey);

    if (!Encoder.isPrimitive(attribute) && element.type !== Type.Nested) {
      attribute = this.resolve(attribute).encode();
    }

    return Encoder.isPrimitive(attribute) ? this.resolvePrimitive(data, element) : this.resolve(attribute);
  }

  /**
   * Resolves a Root Node Element into a Node instance.
   *
   * @param childrenNodes Nodes to be wrapped.
   * @param element Root Node Element representing the Model.
   * @returns Resolved Node.
   */
  protected resolveRootNodeElement(childrenNodes: Node[], element: RootNodeElement): Node {
    if (element.type !== Type.Sequence) {
      throw new EncodingException('Cannot resolve a data not annotated as a Sequence.');
    }

    return new element.node(childrenNodes, element.options);
  }

  /**
   * Encodes the provided data into a BER Encoded Buffer.
   *
   * @returns BER Encoded data.
   */
  public encode(): Buffer {
    return this.node.encode();
  }
}
