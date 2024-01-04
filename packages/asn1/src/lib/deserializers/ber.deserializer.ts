import { Buffer } from 'buffer';

import { bufferToInteger, Enum } from '@guarani/primitives';

import { BerAsn1Class } from '../enums/ber/ber.asn1-class';
import { BerAsn1Encoding } from '../enums/ber/ber.asn1-encoding';
import { BerAsn1Type } from '../enums/ber/ber.asn1-type';
import { DeserializationException } from '../exceptions/deserialization.exception';
import { BitStringNode } from '../nodes/bitstring.node';
import { NodeOptions } from '../nodes/node.options';
import { OctetStringNode } from '../nodes/octetstring.node';
import { Asn1Encoding } from '../types/asn1-encoding.type';
import { decodeLength } from '../utils/length';
import { Asn1Deserializer } from './asn1.deserializer';

/**
 * ASN.1 BER Deserializer.
 */
export class BerDeserializer extends Asn1Deserializer<Buffer> {
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
      options.encoding ??= 'primitive';

      const buffer = this.getSection(BerAsn1Type.bitstring, options);
      const node = new BitStringNode(buffer, options);

      return <string>node.data;
    }

    if (this.getUniversalType(tag) !== BerAsn1Type.bitstring) {
      const expectedTag = BerAsn1Encoding.constructed | BerAsn1Type.bitstring;
      throw new DeserializationException(`Expected Tag "${expectedTag}", got "${tag}".`);
    }

    options.encoding ??= 'constructed';

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
    options.encoding ??= 'primitive';

    const buffer = this.getSection(BerAsn1Type.boolean, options);
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
    options.encoding ??= 'primitive';

    const buffer = this.getSection(BerAsn1Type.integer, options);
    return bufferToInteger(buffer, true);
  }

  /**
   * Deserializes a Null Type.
   *
   * @param options Optional attributes for the Node.
   * @returns `null`.
   */
  public null(options: NodeOptions = {}): null {
    options.encoding ??= 'primitive';

    const buffer = this.getSection(BerAsn1Type.null, options);

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
    options.encoding ??= 'primitive';

    const buffer = this.getSection(BerAsn1Type.objectidentifier, options);

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
      options.encoding ??= 'primitive';

      const buffer = this.getSection(BerAsn1Type.octetstring, options);
      const node = new OctetStringNode(buffer, options);

      return <Buffer>node.data;
    }

    if (this.getUniversalType(tag) !== BerAsn1Type.octetstring) {
      const expectedTag = BerAsn1Encoding.constructed | BerAsn1Type.octetstring;
      throw new DeserializationException(`Expected Tag "${expectedTag}", got "${tag}".`);
    }

    options.encoding ??= 'constructed';

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
    options.encoding ??= 'constructed';

    const buffer = this.getSection(BerAsn1Encoding.constructed | BerAsn1Type.sequence, options);
    const DeserializerConstructor = <typeof BerDeserializer>this.constructor;

    return new DeserializerConstructor(buffer);
  }

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
    this.data = this.data.subarray(bytes);

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
  protected getSection(tag: number, options: NodeOptions = {}): Buffer {
    // Tagged Type.
    if ((this.data[0]! & 0xc0) !== 0x00) {
      if (typeof options.class === 'undefined' || options.class === 'universal') {
        throw new TypeError('Trying to decode a Tagged Type without the proper metadata.');
      }

      if (typeof options.explicit === 'undefined' && typeof options.implicit === 'undefined') {
        throw new TypeError('Trying to decode a Tagged Type without the proper metadata.');
      }

      if (typeof options.explicit !== 'undefined' && typeof options.implicit !== 'undefined') {
        throw new TypeError('An ASN.1 Type cannot have both EXPLICIT and IMPLICIT Tags.');
      }

      if (typeof options.explicit !== 'undefined') {
        const taggedType = BerAsn1Class[options.class] | BerAsn1Encoding.constructed | options.explicit;
        const unwrappedData = this.slice(taggedType);
        const DeserializerConstructor = <typeof BerDeserializer>this.constructor;

        return new DeserializerConstructor(unwrappedData).slice(tag);
      }

      if (typeof options.implicit !== 'undefined') {
        if (typeof options.encoding === 'undefined') {
          throw new TypeError('Missing option "encoding" for IMPLICIT Encoding.');
        }

        tag = BerAsn1Class[options.class] | BerAsn1Encoding[options.encoding] | options.implicit;
      }
    }

    // Universal Tag.
    else {
      let encoding: Asn1Encoding;

      if (typeof options.encoding !== 'undefined') {
        encoding = options.encoding;
      } else {
        encoding = Enum.getKey(BerAsn1Type, tag) === 'sequence' ? 'constructed' : 'primitive';
      }

      tag = BerAsn1Class.universal | BerAsn1Encoding[encoding] | tag;
    }

    return this.slice(tag);
  }

  /**
   * Returns the Unversal value of the provided ASN.1 Tag.
   *
   * @param tag ASN.1 Tag received at the BER Buffer.
   * @returns Universal ASN.1 Type.
   */
  protected getUniversalType(tag: number): number {
    return tag & 0x1f;
  }
}
