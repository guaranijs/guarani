import { Buffer } from 'buffer';

import { Asn1Encoding } from '../asn1-encoding.enum';
import { SerializationException } from '../exceptions/serialization.exception';
import { BitStringNode } from '../nodes/bitstring.node';
import { OctetStringNode } from '../nodes/octetstring.node';
import { BerSerializer } from './ber.serializer';

/**
 * ASN.1 DER Serializer.
 */
export class DerSerializer extends BerSerializer {
  /**
   * Serializes a Bit String Node.
   *
   * @param node Bit String Node to be serialized.
   * @returns Serialized Bit String.
   */
  protected override bitstring(node: BitStringNode): Buffer {
    this.ensureNodeInstance(node, BitStringNode);

    if (node.encoding !== Asn1Encoding.Primitive) {
      throw new SerializationException('A BitString must only be Primitive.');
    }

    return super.bitstring(node);
  }

  /**
   * Serializes an Octet String Node.
   *
   * @param node Octet String Node to be serialized.
   * @returns Serialized Octet String.
   */
  protected override octetstring(node: OctetStringNode): Buffer {
    this.ensureNodeInstance(node, OctetStringNode);

    if (node.encoding !== Asn1Encoding.Primitive) {
      throw new SerializationException('An OctetString must only be Primitive.');
    }

    return super.octetstring(node);
  }
}
