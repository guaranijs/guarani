import { bufferToInteger } from '@guarani/primitives';
import { Optional } from '@guarani/types';

import { Class } from '../class';
import { DecodingException } from '../exceptions/decoding.exception';
import { decodeLength } from '../length';
import { Method } from '../method';
import { NodeOptions } from '../nodes/node.options';
import { Type } from '../type';
import { Decoder } from './decoder';

export class BerDecoder<TModel> extends Decoder<Buffer, TModel> {
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

  private _sliceData(byte: number, isTag: boolean): [number, Buffer] {
    let offset = 0;

    if (this.data[offset++] !== byte) {
      throw new DecodingException(`Expected byte "${byte}", got "${this.data[--offset]}".`);
    }

    // Gets the length of the type/tag.
    const length = Number(decodeLength(this.data.subarray(offset)));

    // Displaces the offset if the length is in Long Form.
    if (this.data[offset] & 0x80) {
      offset += 1 + (this.data[offset] & 0x7f);
    } else {
      offset++;
    }

    const start = isTag ? 0 : offset;
    const end = isTag ? offset : offset + length;

    // Retrieves the section of the data that represents the requested type.
    const buffer = this.data.subarray(start, end);

    // Sets the data to be itself minus the selected data and resets the offset.
    this.data = this.data.slice(end);

    return [length, buffer];
  }

  /**
   * Slices the Data Buffer based on the length of the provided ASN.1 Type.
   *
   * @param type Current ASN.1 Type being parsed.
   * @returns Sliced section represented by the current ASN.1 Type.
   */
  protected slice(type: Type, options: Optional<NodeOptions> = {}): [Type, Buffer] {
    // Explicit Tag.
    if ((this.data[0] & 0xc0) !== 0x00 && (this.data[0] & 0x20) !== 0x00) {
      if (typeof options.class === 'undefined' || options.class === Class.Universal) {
        throw new DecodingException('Trying to decode a Tagged Type without the proper metadata.');
      }

      if (typeof options.explicit === 'undefined') {
        throw new DecodingException('Trying to decode an EXPLICIT Tagged Type without the proper metadata.');
      }

      const tag = options.class | Method.Constructed | options.explicit;

      this._sliceData(tag, true);
    }

    // Implicit Tag.
    else if ((this.data[0] & 0xc0) !== 0x00 && (this.data[0] & 0x20) === 0x00) {
      if (typeof options.class === 'undefined' || options.class === Class.Universal) {
        throw new DecodingException('Trying to decode a Tagged Type without the proper metadata.');
      }

      if (typeof options.implicit === 'undefined') {
        throw new DecodingException('Trying to decode an IMPLICIT Tagged Type without the proper metadata.');
      }

      type = options.class | Method.Primitive | options.implicit;
    }

    // No Tag.
    else {
      type = options.method! | type;
    }

    const [, buffer] = this._sliceData(type, false);

    return [type, buffer];
  }

  /**
   * Abstraction of Tags that do not do any post processings on its data.
   *
   * @param tag Tag passed to the slice method.
   * @returns Tag data wrapped in a new Decoder object.
   */
  protected wrap(tag: number, options?: Optional<NodeOptions>): BerDecoder<TModel> {
    const [, buffer] = this.slice(tag, options);
    return new BerDecoder(buffer, this.model);
  }

  /**
   * Parses a BitString Type.
   */
  protected decodeBitString(options?: Optional<NodeOptions>): Buffer {
    let [, buffer] = this.slice(Type.BitString, options);

    if (buffer.length > 1 && buffer[0] === 0x00) {
      buffer = buffer.subarray(1);
    }

    return buffer;
  }

  /**
   * Parses a Boolean Type.
   */
  protected decodeBoolean(options?: Optional<NodeOptions>): boolean {
    const [, buffer] = this.slice(Type.Boolean, options);
    return buffer.compare(Buffer.from([0x00])) !== 0;
  }

  /**
   * Returns the first N bytes of the Decoder's data buffer
   * and sets it to the remaining bytes.
   *
   * @param length Number of bytes to be displaced.
   */
  protected decodeBytes(length: number): Buffer {
    return this.displace(length);
  }

  /**
   * Parses an Integer Type.
   */
  protected decodeInteger(options?: Optional<NodeOptions>): bigint {
    const [, buffer] = this.slice(Type.Integer, options);
    return bufferToInteger(buffer, true);
  }

  /**
   * Passes the Decoder's data buffer unmodified.
   */
  protected decodeNested(): Buffer {
    return this.data;
  }

  /**
   * Parses a Null Type.
   */
  protected decodeNull(options?: Optional<NodeOptions>): null {
    this.slice(Type.Null, options);
    return null;
  }

  /**
   * Parses an ObjectId Type.
   */
  protected decodeObjectId(options?: Optional<NodeOptions>): string {
    const [, buffer] = this.slice(Type.ObjectId, options);

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
   * Parses an OctetString Type.
   */
  protected decodeOctetString(options?: Optional<NodeOptions>): Buffer {
    const [, buffer] = this.slice(Type.OctetString, options);
    return buffer;
  }

  /**
   * Parses a Sequence Type into a new Decoder instance.
   */
  protected decodeSequence(options?: Optional<NodeOptions>): BerDecoder<TModel> {
    return this.wrap(Type.Sequence, options);
  }
}
