import { EncodingException } from '../exceptions/encoding.exception';
import { Encoding } from '../encoding';
import { BitStringNode } from '../nodes/bitstring.node';
import { OctetStringNode } from '../nodes/octetstring.node';
import { BerEncoder } from './ber.encoder';

/**
 * ASN.1 DER Encoder.
 */
export class DerEncoder extends BerEncoder {
  /**
   * Encodes a Bit String Node.
   *
   * @param node Bit String Node to be encoded.
   * @returns Encoded Bit String.
   */
  protected encodeBitString(node: BitStringNode): Buffer {
    this.ensureNodeInstance(node, BitStringNode);

    if (node.encoding !== Encoding.Primitive) {
      throw new EncodingException('A BitString must only be Primitive.');
    }

    return super.encodeBitString(node);
  }

  /**
   * Encodes an Octet String Node.
   *
   * @param node Octet String Node to be encoded.
   * @returns Encoded Octet String.
   */
  protected encodeOctetString(node: OctetStringNode): Buffer {
    this.ensureNodeInstance(node, OctetStringNode);

    if (node.encoding !== Encoding.Primitive) {
      throw new EncodingException('An OctetString must only be Primitive.');
    }

    return super.encodeOctetString(node);
  }
}
