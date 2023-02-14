import { Asn1Encoding } from '../asn1-encoding.enum';
import { Asn1Type } from '../asn1-type.enum';
import { DeserializationException } from '../exceptions/deserialization.exception';
import { NodeOptions } from '../nodes/node.options';
import { BerDeserializer } from './ber.deserializer';

/**
 * ASN.1 DER Deserializer.
 */
export class DerDeserializer extends BerDeserializer {
  /**
   * Deserializes a BitString Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Bit String.
   */
  public override bitstring(options: NodeOptions = {}): string {
    if (options.encoding !== undefined && options.encoding !== Asn1Encoding.Primitive) {
      throw new DeserializationException('Unsupported Constructed Encoding for BitString.');
    }

    return super.bitstring(options);
  }

  /**
   * Deserializes a Boolean Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Boolean.
   */
  public override boolean(options: NodeOptions = {}): boolean {
    const buffer = this.getSection(Asn1Type.Boolean, options);

    if (buffer.length !== 1) {
      throw new DeserializationException('Invalid Boolean value.');
    }

    const byte = buffer[0];

    if (byte !== 0x00 && byte !== 0xff) {
      throw new DeserializationException('Invalid Boolean value.');
    }

    return byte === 0xff;
  }

  /**
   * Deserializes an OctetString Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Octet String.
   */
  public override octetstring(options: NodeOptions = {}): Buffer {
    if (options.encoding !== undefined && options.encoding !== Asn1Encoding.Primitive) {
      throw new DeserializationException('Unsupported Constructed Encoding for OctetString.');
    }

    return super.octetstring(options);
  }
}
