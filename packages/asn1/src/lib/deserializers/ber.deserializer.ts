import { bufferToInteger } from '@guarani/primitives';

import { Buffer } from 'buffer';

import { Asn1Class } from '../asn1-class.enum';
import { Asn1Encoding } from '../asn1-encoding.enum';
import { Asn1Type } from '../asn1-type.enum';
import { DeserializationException } from '../exceptions/deserialization.exception';
import { decodeLength } from '../length';
import { BitStringNode } from '../nodes/bitstring.node';
import { NodeOptions } from '../nodes/node.options';
import { OctetStringNode } from '../nodes/octetstring.node';
import { Asn1Deserializer } from './deserializer';

/**
 * ASN.1 BER Deserializer.
 */
export class BerDeserializer extends Asn1Deserializer<Buffer> {
  /**
   * Displaces the reference pointer by the number of requested bytes.
   *
   * @param bytes Number of bytes to be displaced.
   * @returns Data of the displaced bytes.
   */
  protected displace(bytes: number): Buffer {
    if (!Number.isInteger(bytes) || bytes < 0) {
      throw new TypeError('Invalid parameter "bytes".');
    }

    // Retrieves the requested section.
    const buffer = this.data.subarray(0, bytes);

    // Sets the Deserializer's data to the remaining data.
    this.data = this.data.slice(bytes);

    return buffer;
  }

  /**
   * Returns the data represented by the provided ASN.1 Tag.
   *
   * @param tag Expected ASN.1 Tag.
   * @returns Sectioned data represented by the provided ASN.1 Tag.
   */
  protected slice(tag: number): Buffer {
    if (!this.is(tag)) {
      throw new DeserializationException(`Expected Tag "${tag}", got "${this.data[0]}".`);
    }

    let offset = 1;

    // Gets the length of the tag.
    const length = decodeLength(this.data.subarray(offset));

    // Displaces the offset if the length is in Long Form.
    if ((this.data[offset]! & 0x80) !== 0x00) {
      offset += 1 + (this.data[offset]! & 0x7f);
    } else {
      offset++;
    }

    // Extracts the metadata.
    this.displace(offset);

    // Returns the data represented by the tag.
    return this.displace(length);
  }

  /**
   * Returns the data represented by the provided ASN.1 Tag.
   *
   * @param tag Expected ASN.1 Tag.
   * @param options Metadata of the expected format of the data section.
   * @returns Sectioned data represented by the provided ASN.1 Tag.
   */
  protected getSection(tag: Asn1Type, options: NodeOptions = {}): Buffer {
    // Tagged Type.
    if ((this.data[0]! & 0xc0) !== 0x00) {
      if (options.class === undefined || options.class === Asn1Class.Universal) {
        throw new TypeError('Trying to decode a Tagged Type without the proper metadata.');
      }

      if (options.explicit === undefined && options.implicit === undefined) {
        throw new TypeError('Trying to decode a Tagged Type without the proper metadata.');
      }

      if (options.explicit !== undefined && options.implicit !== undefined) {
        throw new TypeError('An ASN.1 Type cannot have both EXPLICIT and IMPLICIT Tags.');
      }

      if (options.explicit !== undefined) {
        const taggedType = options.class | Asn1Encoding.Constructed | options.explicit;
        const unwrappedData = this.slice(taggedType);
        const DeserializerConstructor = <typeof BerDeserializer>this.constructor;

        return new DeserializerConstructor(unwrappedData).slice(tag);
      }

      if (options.implicit !== undefined) {
        if (options.encoding === undefined) {
          throw new TypeError('Missing option "encoding" for IMPLICIT Encoding.');
        }

        tag = options.class | options.encoding | options.implicit;
      }
    }

    // Universal Tag.
    else {
      let encoding: Asn1Encoding;

      if (options.encoding !== undefined) {
        encoding = options.encoding;
      } else {
        encoding = tag === Asn1Type.Sequence ? Asn1Encoding.Constructed : Asn1Encoding.Primitive;
      }

      tag = Asn1Class.Universal | encoding | tag;
    }

    return this.slice(tag);
  }

  /**
   * Returns the Unversal value of the provided ASN.1 Tag.
   *
   * @param tag ASN.1 Tag received at the BER Buffer.
   * @returns Universal ASN.1 Type.
   */
  protected getUniversalType(tag: number): Asn1Type {
    return tag & 0x1f;
  }

  /**
   * Checks if the current encoded ASN.1 Type has the provided Tag.
   *
   * @param tag Expected Tag.
   */
  public is(tag: number): boolean {
    return this.data[0] === tag;
  }

  /**
   * Deserializes a BitString Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Bit String.
   */
  public bitstring(options: NodeOptions = {}): string {
    const tag = this.data[0]!;

    if ((tag & 0xc0) !== 0x00 || (tag & 0x20) === 0x00) {
      options.encoding ??= Asn1Encoding.Primitive;

      const buffer = this.getSection(Asn1Type.BitString, options);
      const node = new BitStringNode(buffer, options);

      return <string>node.data;
    }

    if (this.getUniversalType(tag) !== Asn1Type.BitString) {
      const expectedTag = Asn1Encoding.Constructed | Asn1Type.BitString;
      throw new DeserializationException(`Expected Tag "${expectedTag}", got "${tag}".`);
    }

    options.encoding ??= Asn1Encoding.Constructed;

    const DeseiralizerConstructor = <typeof BerDeserializer>this.constructor;
    const subDeserializer = new DeseiralizerConstructor(this.getSection(tag, options));

    const children: string[] = [];

    while (subDeserializer.data.length !== 0) {
      children.push(subDeserializer.bitstring());
    }

    return children.join('');
  }

  /**
   * Deserializes a Boolean Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Boolean.
   */
  public boolean(options: NodeOptions = {}): boolean {
    options.encoding ??= Asn1Encoding.Primitive;

    const buffer = this.getSection(Asn1Type.Boolean, options);
    return buffer.some((byte) => byte !== 0x00);
  }

  /**
   * Returns the first N bytes of the Deserializer's data.
   *
   * @param length Number of bytes to be returned.
   * @returns First N bytes of the Deserializer's data.
   */
  public bytes(length: number): Buffer {
    return this.displace(length);
  }

  /**
   * Deserializes an Integer Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Integer.
   */
  public integer(options: NodeOptions = {}): bigint {
    options.encoding ??= Asn1Encoding.Primitive;

    const buffer = this.getSection(Asn1Type.Integer, options);
    return bufferToInteger(buffer, true);
  }

  /**
   * Deserializes a Null Type.
   *
   * @param options Optional attributes for the Node.
   * @returns `null`.
   */
  public null(options: NodeOptions = {}): null {
    options.encoding ??= Asn1Encoding.Primitive;

    const buffer = this.getSection(Asn1Type.Null, options);

    if (buffer.length !== 0) {
      throw new DeserializationException('Invalid Null Type.');
    }

    return null;
  }

  /**
   * Deserializes an ObjectIdentifier Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Object Identifier.
   */
  public objectidentifier(options: NodeOptions = {}): string {
    options.encoding ??= Asn1Encoding.Primitive;

    const buffer = this.getSection(Asn1Type.ObjectIdentifier, options);

    const firstDigit = Math.floor(buffer[0]! / 40);
    const secondDigit = buffer[0]! % 40;

    const numbers: number[] = [firstDigit, secondDigit];

    for (let i = 1, value = 0; i < buffer.length; i++) {
      const byte = buffer[i]!;
      value <<= 7;

      if ((byte & 0x80) !== 0x00) {
        value += byte & 0x7f;
      } else {
        numbers.push(value + byte);
        value = 0;
      }
    }

    return numbers.join('.');
  }

  /**
   * Deserializes an OctetString Type.
   *
   * @param options Optional attributes for the Node.
   * @returns Resulting Octet String.
   */
  public octetstring(options: NodeOptions = {}): Buffer {
    const tag = this.data[0]!;

    if ((tag & 0xc0) !== 0x00 || (tag & 0x20) === 0x00) {
      options.encoding ??= Asn1Encoding.Primitive;

      const buffer = this.getSection(Asn1Type.OctetString, options);
      const node = new OctetStringNode(buffer, options);

      return <Buffer>node.data;
    }

    if (this.getUniversalType(tag) !== Asn1Type.OctetString) {
      const expectedTag = Asn1Encoding.Constructed | Asn1Type.OctetString;
      throw new DeserializationException(`Expected Tag "${expectedTag}", got "${tag}".`);
    }

    options.encoding ??= Asn1Encoding.Constructed;

    const DeserializerConstructor = <typeof BerDeserializer>this.constructor;
    const subDeserializer = new DeserializerConstructor(this.getSection(tag, options));

    const children: Buffer[] = [];

    while (subDeserializer.data.length !== 0) {
      children.push(subDeserializer.octetstring());
    }

    return Buffer.concat(children);
  }

  /**
   * Deserializes a Sequence Type
   *
   * @param options Optional attributes for the Node.
   * @returns Deserializer for the Children Nodes of the Sequence.
   */
  public sequence(options: NodeOptions = {}): BerDeserializer {
    options.encoding ??= Asn1Encoding.Constructed;

    const buffer = this.getSection(Asn1Encoding.Constructed | Asn1Type.Sequence, options);
    const DeserializerConstructor = <typeof BerDeserializer>this.constructor;

    return new DeserializerConstructor(buffer);
  }
}
