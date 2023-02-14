import { binaryToBuffer, integerToBuffer } from '@guarani/primitives';

import { Buffer } from 'buffer';

import { Asn1Encoding } from '../asn1-encoding.enum';
import { encodeLength } from '../length';
import { BitStringNode } from '../nodes/bitstring.node';
import { BooleanNode } from '../nodes/boolean.node';
import { IntegerNode } from '../nodes/integer.node';
import { Node } from '../nodes/node';
import { NullNode } from '../nodes/null.node';
import { ObjectIdentifierNode } from '../nodes/object-identifier.node';
import { OctetStringNode } from '../nodes/octetstring.node';
import { SequenceNode } from '../nodes/sequence.node';
import { Asn1Serializer } from './serializer';

/**
 * ASN.1 BER Serializer.
 */
export class BerSerializer extends Asn1Serializer<Buffer> {
  /**
   * Serializes a Bit String Node.
   *
   * @param node Bit String Node to be serialized.
   * @returns Serialized Bit String.
   */
  protected bitstring(node: BitStringNode): Buffer {
    this.ensureNodeInstance(node, BitStringNode);

    // Primitive.
    if (typeof node.data === 'string') {
      const data = `${node.data}${node.padding}`;
      return Buffer.concat([integerToBuffer(node.padding.length), binaryToBuffer(data)]);
    }

    // Constructed.
    else {
      const partials = node.data.map((child) => this.encode(child));
      return Buffer.concat(partials);
    }
  }

  /**
   * Serializes a Boolean Node.
   *
   * @param node Boolean Node to be serialized.
   * @returns Serialized Boolean.
   */
  protected boolean(node: BooleanNode): Buffer {
    this.ensureNodeInstance(node, BooleanNode);
    return integerToBuffer(node.data ? 0xff : 0x00);
  }

  /**
   * Serializes an Integer Node.
   *
   * @param node Integer Node to be serialized.
   * @returns Serialized Integer.
   */
  protected integer(node: IntegerNode): Buffer {
    this.ensureNodeInstance(node, IntegerNode);
    return integerToBuffer(node.data, true);
  }

  /**
   * Serializes a Null Node.
   *
   * @param node Null Node to be serialized.
   * @returns Serialized Null.
   */
  protected null(node: NullNode): Buffer {
    this.ensureNodeInstance(node, NullNode);
    return Buffer.alloc(0);
  }

  /**
   * Serializes an Object Identifier Node.
   *
   * @param node Object Identifier Node to be serialized.
   * @returns Serialized Object Identifier.
   */
  protected objectidentifier(node: ObjectIdentifierNode): Buffer {
    this.ensureNodeInstance(node, ObjectIdentifierNode);

    const data = node.data.split('.').map((item) => Number.parseInt(item, 10));

    const bytes: Buffer[] = [];
    const firstByte = integerToBuffer(40 * data[0]! + data[1]!);

    for (let i = data.length - 1; i > 1; i--) {
      let element = data[i]!;

      bytes.push(integerToBuffer(element & 0x7f));

      while ((element >>>= 7) > 0) {
        bytes.push(integerToBuffer(0x80 | (element & 0x7f)));
      }
    }

    return Buffer.concat([firstByte, ...bytes.reverse()]);
  }

  /**
   * Serializes an Octet String Node.
   *
   * @param node Octet String Node to be serialized.
   * @returns Serialized Octet String.
   */
  protected octetstring(node: OctetStringNode): Buffer {
    this.ensureNodeInstance(node, OctetStringNode);

    // Primitive.
    if (Buffer.isBuffer(node.data)) {
      return node.data;
    }

    // Constructed.
    else {
      const partials = node.data.map((child) => this.encode(child));
      return Buffer.concat(partials);
    }
  }

  /**
   * Serializes a Sequence Node.
   *
   * @param node Sequence Node to be serialized.
   * @returns Serialized Sequence.
   */
  protected sequence(node: SequenceNode): Buffer {
    this.ensureNodeInstance(node, SequenceNode);
    const partials = node.data.map((child) => this.encode(child));
    return Buffer.concat(partials);
  }

  /**
   * Serializes the data of the provided Node as an untagged or implicitly tagged type.
   *
   * @param node Node to be serialized.
   * @returns Serialized Untagged or Implicitly Tagged TLV data of the Node.
   */
  private _encodeTLV(node: Node): Buffer {
    let { type } = node;

    const encoder = this.serializers[type]!;

    const value = encoder.apply(this, [node]);
    const length = encodeLength(value.length);

    // Implicit Tagging.
    if (node.implicit !== undefined) {
      type = node.class | node.encoding | node.implicit;
    }

    // No Tagging.
    else if (node.explicit === undefined) {
      type = node.encoding | type;
    }

    const tag = integerToBuffer(type);

    return Buffer.concat([tag, length, value]);
  }

  /**
   * Serializes the provided Node.
   *
   * @param node Node to be serialized.
   * @returns Serialized TLV data of the Node.
   */
  public encode(node: Node): Buffer {
    let tlv = this._encodeTLV(node);

    if (node.explicit !== undefined) {
      const taggedType = node.class | Asn1Encoding.Constructed | node.explicit;

      const length = encodeLength(tlv.length);
      const tag = integerToBuffer(taggedType);

      tlv = Buffer.concat([tag, length, tlv]);
    }

    return tlv;
  }
}
