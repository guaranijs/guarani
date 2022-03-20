import { bufferToInteger } from '@guarani/primitives';
import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Encoding } from '../encoding';
import { DecodingException } from '../exceptions/decoding.exception';
import { decodeLength } from '../length';
import { BitStringNode } from '../nodes/bitstring.node';
import { NodeOptions } from '../nodes/node.options';
import { OctetStringNode } from '../nodes/octetstring.node';
import { Type } from '../type';
import { Decoder } from './decoder';

/**
 * ASN.1 BER Decoder.
 */
export class BerDecoder extends Decoder<Buffer> {
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

    // Sets the Decoder's data to the remaining data.
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
      throw new DecodingException(`Expected Tag "${tag}", got "${this.data[0]}".`);
    }

    let offset = 1;

    // Gets the length of the tag.
    const length = decodeLength(this.data.subarray(offset));

    // Displaces the offset if the length is in Long Form.
    if ((this.data[offset] & 0x80) !== 0x00) {
      offset += 1 + (this.data[offset] & 0x7f);
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
  protected getSection(tag: Type, options: Optional<NodeOptions> = {}): Buffer {
    // Tagged Type.
    if ((this.data[0] & 0xc0) !== 0x00) {
      if (options.class === undefined || options.class === Class.Universal) {
        throw new TypeError('Trying to decode a Tagged Type without the proper metadata.');
      }

      if (options.explicit === undefined && options.implicit === undefined) {
        throw new TypeError('Trying to decode a Tagged Type without the proper metadata.');
      }

      if (options.explicit !== undefined && options.implicit !== undefined) {
        throw new TypeError('An ASN.1 Type cannot have both EXPLICIT and IMPLICIT Tags.');
      }

      if (options.explicit !== undefined) {
        const taggedType = options.class | Encoding.Constructed | options.explicit;
        const unwrappedData = this.slice(taggedType);
        const DecoderConstructor = <typeof BerDecoder>this.constructor;

        return new DecoderConstructor(unwrappedData).slice(tag);
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
      let encoding: Encoding;

      if (options.encoding !== undefined) {
        encoding = options.encoding;
      } else {
        encoding = tag === Type.Sequence ? Encoding.Constructed : Encoding.Primitive;
      }

      tag = Class.Universal | encoding | tag;
    }

    return this.slice(tag);
  }

  /**
   * Returns the Unversal value of the provided ASN.1 Tag.
   *
   * @param tag ASN.1 Tag received at the BER Buffer.
   * @returns Universal ASN.1 Type.
   */
  protected getUniversalType(tag: number): Type {
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
   * Decodes a BitString Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Bit String.
   */
  public decodeBitString(options: Optional<NodeOptions> = {}): string {
    const tag = this.data[0];

    if ((tag & 0xc0) !== 0x00 || (tag & 0x20) === 0x00) {
      options.encoding ??= Encoding.Primitive;

      const buffer = this.getSection(Type.BitString, options);
      const node = new BitStringNode(buffer, options);

      return <string>node.data;
    }

    if (this.getUniversalType(tag) !== Type.BitString) {
      const expectedTag = Encoding.Constructed | Type.BitString;
      throw new DecodingException(`Expected Tag "${expectedTag}", got "${tag}".`);
    }

    options.encoding ??= Encoding.Constructed;

    const DecoderConstructor = <typeof BerDecoder>this.constructor;
    const subdecoder = new DecoderConstructor(this.getSection(tag, options));

    const children: string[] = [];

    while (subdecoder.data.length !== 0) {
      children.push(subdecoder.decodeBitString());
    }

    return children.join('');
  }

  /**
   * Decodes a Boolean Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Boolean.
   */
  public decodeBoolean(options: Optional<NodeOptions> = {}): boolean {
    options.encoding ??= Encoding.Primitive;

    const buffer = this.getSection(Type.Boolean, options);
    return buffer.some((byte) => byte !== 0x00);
  }

  /**
   * Returns the first N bytes of the Decoder's data.
   *
   * @param length Number of bytes to be returned.
   * @returns First N bytes of the Decoder's data.
   */
  public decodeBytes(length: number): Buffer {
    return this.displace(length);
  }

  /**
   * Decodes an Integer Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Integer.
   */
  public decodeInteger(options: Optional<NodeOptions> = {}): bigint {
    options.encoding ??= Encoding.Primitive;

    const buffer = this.getSection(Type.Integer, options);
    return bufferToInteger(buffer, true);
  }

  /**
   * Decodes a Null Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns `null`.
   */
  public decodeNull(options: Optional<NodeOptions> = {}): null {
    options.encoding ??= Encoding.Primitive;

    const buffer = this.getSection(Type.Null, options);

    if (buffer.length !== 0) {
      throw new DecodingException('Invalid Null Type.');
    }

    return null;
  }

  /**
   * Decodes an ObjectIdentifier Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Object Identifier.
   */
  public decodeObjectIdentifier(options: Optional<NodeOptions> = {}): string {
    options.encoding ??= Encoding.Primitive;

    const buffer = this.getSection(Type.ObjectIdentifier, options);

    const firstDigit = Math.floor(buffer[0] / 40);
    const secondDigit = buffer[0] % 40;

    const numbers: number[] = [firstDigit, secondDigit];

    for (let i = 1, value = 0; i < buffer.length; i++) {
      const byte = buffer[i];
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
   * Decodes an OctetString Type.
   *
   * @param options Optional attributes for the Node, along with the Transformers registered for it.
   * @returns Resulting Octet String.
   */
  public decodeOctetString(options: Optional<NodeOptions> = {}): Buffer {
    const tag = this.data[0];

    if ((tag & 0xc0) !== 0x00 || (tag & 0x20) === 0x00) {
      options.encoding ??= Encoding.Primitive;

      const buffer = this.getSection(Type.OctetString, options);
      const node = new OctetStringNode(buffer, options);

      return <Buffer>node.data;
    }

    if (this.getUniversalType(tag) !== Type.OctetString) {
      const expectedTag = Encoding.Constructed | Type.OctetString;
      throw new DecodingException(`Expected Tag "${expectedTag}", got "${tag}".`);
    }

    options.encoding ??= Encoding.Constructed;

    const DecoderConstructor = <typeof BerDecoder>this.constructor;
    const subdecoder = new DecoderConstructor(this.getSection(tag, options));

    const children: Buffer[] = [];

    while (subdecoder.data.length !== 0) {
      children.push(subdecoder.decodeOctetString());
    }

    return Buffer.concat(children);
  }

  /**
   * Decodes a Sequence Type
   *
   * @param options Optional attributes for the Node.
   * @returns Decoder for the Children Nodes of the Sequence.
   */
  public decodeSequence(options: Optional<NodeOptions> = {}): BerDecoder {
    options.encoding ??= Encoding.Constructed;

    const buffer = this.getSection(Encoding.Constructed | Type.Sequence, options);
    const DecoderConstructor = <typeof BerDecoder>this.constructor;

    return new DecoderConstructor(buffer);
  }
}
