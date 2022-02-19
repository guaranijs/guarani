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
import { Decoder, NodeOptionsWithTransformer } from './decoder';

export class BerDecoder<TModel extends object> extends Decoder<Buffer, TModel> {
  /**
   * Slices and returns the data represented by the provided ASN.1 Tag.
   *
   * @param tag Expected ASN.1 Tag.
   * @param explicit Indicates that the ASN.1 Tag is an EXPLICIT Tag.
   * @returns Data represented by the ASN.1 Tag.
   */
  private sliceData(tag: number, explicit: boolean, size?: Optional<number | [number, number]>): Buffer {
    let offset = 0;

    if (this.data[offset++] !== tag) {
      throw new DecodingException(`Expected Tag "${tag}", got "${this.data[--offset]}".`);
    }

    // Gets the length of the tag.
    const length = decodeLength(this.data.subarray(offset));

    if (size !== undefined) {
      if (typeof size === 'number' && size !== length) {
        throw new DecodingException(`Element of Tag "${tag}" was expected to have ${size} bytes, got ${length}.`);
      }

      if (Array.isArray(size) && (length < size[0] || length > size[1])) {
        throw new DecodingException(`Element of Tag "${tag}" has ${length} bytes, outside of the range [${size}].`);
      }
    }

    // Displaces the offset if the length is in Long Form.
    if ((this.data[offset] & 0x80) !== 0x00) {
      offset += 1 + (this.data[offset] & 0x7f);
    } else {
      offset++;
    }

    const left = explicit ? 0 : offset;
    const right = explicit ? offset : offset + length;

    // Retrieves the section of the data that represents the requested tag.
    const buffer = this.data.subarray(left, right);

    // Sets the data to be itself minus the selected data and resets the offset.
    this.data = this.data.slice(right);

    return buffer;
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
   * Returns the data represented by the provided ASN.1 Type.
   *
   * @param tag Expected ASN.1 Type.
   * @param options Metadata of the expected format of the data section.
   */
  protected getSection(tag: Type, options: Optional<NodeOptionsWithTransformer> = {}): Buffer {
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
        this.sliceData(taggedType, true);
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

    let data = this.sliceData(tag, false);

    options.transformer?.beforeDecode.forEach((transformerFunction) => (data = transformerFunction(data)));

    return data;
  }

  /**
   * Displaces the reference pointer by the number of requested bytes.
   *
   * @param bytes Number of bytes to be displaced.
   * @returns Data of the displaced bytes.
   */
  protected displace(bytes: number): Buffer {
    if (!Number.isInteger(bytes) || bytes <= 0) {
      throw new TypeError('Invalid parameter "bytes".');
    }

    const buffer = this.data.subarray(0, bytes);
    this.data = this.data.slice(bytes);

    return buffer;
  }

  /**
   * Decodes a BitString Type.
   */
  protected decodeBitString(options: Optional<NodeOptionsWithTransformer> = {}): string {
    const tag = this.data[0];

    if ((tag & 0xc0) !== 0x00 || (tag & 0x20) === 0x00) {
      const buffer = this.getSection(Type.BitString, options);
      const node = new BitStringNode(buffer, options);

      return <string>node.data;
    }

    if (this.getUniversalType(tag) !== Type.BitString) {
      const expectedTag = Encoding.Constructed | Type.BitString;
      throw new DecodingException(`Expected Tag "${expectedTag}", got "${tag}".`);
    }

    const subdecoder = new (<typeof BerDecoder>this.constructor)(this.getSection(Type.BitString, options), this.Model);

    const children: string[] = [];

    while (subdecoder.data.length !== 0) {
      const childOptions: NodeOptions = { class: Class.Universal, encoding: Encoding.Primitive };
      const bitstring = subdecoder.decodeBitString(childOptions);

      children.push(bitstring);
    }

    return children.join('');
  }

  /**
   * Decodes a Boolean Type.
   */
  protected decodeBoolean(options: Optional<NodeOptionsWithTransformer> = {}): boolean {
    const buffer = this.getSection(Type.Boolean, options);
    return buffer.some((byte) => byte !== 0x00);
  }

  /**
   * Returns the first N bytes of the Decoder's data buffer based on the `length` option.
   */
  protected decodeBytes(options: Optional<NodeOptions> = {}): Buffer {
    if (options.length === undefined) {
      throw new DecodingException('Missing required option "length".');
    }

    return this.displace(options.length);
  }

  /**
   * Decodes an Integer Type.
   */
  protected decodeInteger(options: Optional<NodeOptionsWithTransformer> = {}): bigint {
    const buffer = this.getSection(Type.Integer, options);
    return bufferToInteger(buffer, true);
  }

  /**
   * Returns the data of the Decoder unmodified.
   */
  protected decodeNested(): Buffer {
    return this.data;
  }

  /**
   * Decodes a Null Type.
   */
  protected decodeNull(options: Optional<NodeOptionsWithTransformer> = {}): null {
    this.getSection(Type.Null, options);
    return null;
  }

  /**
   * Decodes an ObjectIdentifier Type.
   */
  protected decodeObjectIdentifier(options: Optional<NodeOptionsWithTransformer> = {}): string {
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
   */
  protected decodeOctetString(options: Optional<NodeOptionsWithTransformer> = {}): string {
    const tag = this.data[0];

    if ((tag & 0xc0) !== 0x00 || (tag & 0x20) === 0x00) {
      const buffer = this.getSection(Type.OctetString, options);
      const node = new OctetStringNode(buffer);

      return <string>node.data;
    }

    if (this.getUniversalType(tag) !== Type.OctetString) {
      const expectedTag = Encoding.Constructed | Type.OctetString;
      throw new DecodingException(`Expected Tag "${expectedTag}", got "${tag}".`);
    }

    const subdecoder = new (<typeof BerDecoder>this.constructor)(
      this.getSection(Type.OctetString, options),
      this.Model
    );

    const children: string[] = [];

    while (subdecoder.data.length !== 0) {
      const childOptions: NodeOptions = { class: Class.Universal, encoding: Encoding.Primitive };
      const octetstring = subdecoder.decodeOctetString(childOptions);

      children.push(octetstring);
    }

    return children.join('');
  }

  /**
   * Decodes a Sequence Type.
   */
  protected decodeSequence(options: Optional<NodeOptions> = {}): BerDecoder<TModel> {
    if (this.Model === null) {
      throw new DecodingException('Could not find a valid Model.');
    }

    const buffer = this.getSection(Type.Sequence, options);
    return new (<typeof BerDecoder>this.constructor)(buffer, this.Model);
  }
}
