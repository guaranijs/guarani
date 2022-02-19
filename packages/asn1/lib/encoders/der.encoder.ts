import { EncodingException } from '../exceptions/encoding.exception';
import { InternalNodeElement } from '../metadata/elements/internal-node.element';
import { Method } from '../method';
import { Node } from '../nodes/node';
import { Type } from '../type';
import { BerEncoder } from './ber.encoder';

export class DerEncoder extends BerEncoder {
  /**
   * Resolves an Internal Node Element into a Node instance.
   *
   * @param data Data to be resolved.
   * @param element Internal Node Element representing a property of the data.
   * @returns Resolved Node.
   */
  protected resolveInternalNodeElement(data: object, element: InternalNodeElement): Node {
    if (element.type === Type.BitString && element.options!.method! === Method.Constructed) {
      throw new EncodingException('A BitString must not be Constructed.');
    }

    if (element.type === Type.OctetString && element.options!.method! === Method.Constructed) {
      throw new EncodingException('An OctetString must not be Constructed.');
    }

    return super.resolveInternalNodeElement(data, element);
  }

  /**
   * Encodes the provided data into a DER Encoded Buffer.
   *
   * @returns DER Encoded data.
   */
  public encode(): Buffer {
    return super.encode();
  }
}
