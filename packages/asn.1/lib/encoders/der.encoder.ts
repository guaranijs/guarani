import { EncodingException } from '../exceptions/encoding.exception';
import { Encoding } from '../encoding';
import { BitStringNode } from '../nodes/bitstring.node';
import { OctetStringNode } from '../nodes/octetstring.node';
import { BerEncoder } from './ber.encoder';

export class DerEncoder extends BerEncoder {
  /**
   * Encodes the BitString Node into a Buffer object.
   *
   * @example
   * new BitStringNode(Buffer.from([0x02, 0x0d, 0x4f, 0x9e, 0xb3])) => <Buffer 03 06 00 02 0d 4f 9e b3>
   */
  protected encodeBitString(node: BitStringNode): Buffer {
    this.ensureNodeInstance(node, BitStringNode);

    if (node.encoding !== Encoding.Primitive) {
      throw new EncodingException('A BitString must only be Primitive.');
    }

    return super.encodeBitString(node);
  }

  /**
   * Encodes the OctetString Node into a Buffer object.
   *
   * @example
   * new OctetStringNode(Buffer.from([0x02, 0x0d, 0x4f, 0x9e, 0xb3])) => <Buffer 04 05 02 0d 4f 9e b3>
   */
  protected encodeOctetString(node: OctetStringNode): Buffer {
    this.ensureNodeInstance(node, OctetStringNode);

    if (node.encoding !== Encoding.Primitive) {
      throw new EncodingException('An OctetString must only be Primitive.');
    }

    return super.encodeOctetString(node);
  }
}
