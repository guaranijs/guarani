import { binaryToBuffer, integerToBuffer } from '@guarani/primitives';

import { Encoding } from '../encoding';
import { encodeLength } from '../length';
import { BitStringNode } from '../nodes/bitstring.node';
import { BooleanNode } from '../nodes/boolean.node';
import { IntegerNode } from '../nodes/integer.node';
import { Node } from '../nodes/node';
import { NullNode } from '../nodes/null.node';
import { ObjectIdentifierNode } from '../nodes/object-identifier.node';
import { OctetStringNode } from '../nodes/octetstring.node';
import { SequenceNode } from '../nodes/sequence.node';
import { Encoder } from './encoder';

export class BerEncoder extends Encoder<Buffer> {
  /**
   * Encodes a BitString Node.
   */
  protected encodeBitString(node: BitStringNode): Buffer {
    this.ensureNodeInstance(node, BitStringNode);

    // Primitive.
    if (typeof node.data === 'string') {
      const data = `${node.data}${node.padding}`;
      return Buffer.concat([integerToBuffer(node.padding.length), binaryToBuffer(data)]);
    }

    // Constructed.
    else {
      const partials = node.data.map((child) => this.encodeNode(child));
      return Buffer.concat(partials);
    }
  }

  /**
   * Encodes a Boolean Node.
   */
  protected encodeBoolean(node: BooleanNode): Buffer {
    this.ensureNodeInstance(node, BooleanNode);
    return integerToBuffer(node.data ? 0xff : 0x00);
  }

  /**
   * Encodes an Integer Node.
   */
  protected encodeInteger(node: IntegerNode): Buffer {
    this.ensureNodeInstance(node, IntegerNode);
    return integerToBuffer(node.data, true);
  }

  /**
   * Encodes a Null Node.
   */
  protected encodeNull(node: NullNode): Buffer {
    this.ensureNodeInstance(node, NullNode);
    return Buffer.alloc(0);
  }

  /**
   * Encodes an Object Identifier Node.
   */
  protected encodeObjectIdentifier(node: ObjectIdentifierNode): Buffer {
    this.ensureNodeInstance(node, ObjectIdentifierNode);

    const bytes: Buffer[] = [];
    const firstByte = integerToBuffer(40 * node.data[0] + node.data[1]);

    for (let i = node.data.length - 1; i > 1; i--) {
      let element = node.data[i];

      bytes.push(integerToBuffer(element & 0x7f));

      while ((element >>>= 7) > 0) {
        bytes.push(integerToBuffer(0x80 | (element & 0x7f)));
      }
    }

    return Buffer.concat([firstByte, ...bytes.reverse()]);
  }

  /**
   * Encodes an OctetString Node.
   */
  protected encodeOctetString(node: OctetStringNode): Buffer {
    this.ensureNodeInstance(node, OctetStringNode);

    // Primitive.
    if (typeof node.data === 'string') {
      return Buffer.from(node.data, 'hex');
    }

    // Constructed.
    else {
      const partials = node.data.map((child) => this.encodeNode(child));
      return Buffer.concat(partials);
    }
  }

  /**
   * Encodes a Sequence Node.
   */
  protected encodeSequence(node: SequenceNode): Buffer {
    this.ensureNodeInstance(node, SequenceNode);
    const partials = node.data.map((child) => this.encodeNode(child));
    return Buffer.concat(partials);
  }

  /**
   * Encodes the data of the provided Node as an untagged or implicitly tagged type.
   *
   * @param node Node to be encoded.
   */
  private encodeTLV(node: Node): Buffer {
    let { type } = node;

    const encoder = this.encoders[type];

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
   * Encodes the provided Node.
   *
   * @param node Node to be encoded.
   */
  protected encodeNode(node: Node): Buffer {
    let tlv = this.encodeTLV(node);

    if (node.explicit !== undefined) {
      const taggedType = node.class | Encoding.Constructed | node.explicit;

      const length = encodeLength(tlv.length);
      const tag = integerToBuffer(taggedType);

      tlv = Buffer.concat([tag, length, tlv]);
    }

    return tlv;
  }
}
