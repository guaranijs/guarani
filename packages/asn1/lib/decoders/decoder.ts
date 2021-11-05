import { fromBuffer } from '@guarani/utils/primitives'
import { Nullable } from '@guarani/utils/types'

import {
  BitString,
  Integer,
  Null,
  ObjectId,
  OctetString,
  Sequence
} from '../nodes'
import { decodeLength } from '../_utils'

const Tags = {
  ZERO: 0x00,
  BOOLEAN: 0x01,
  INTEGER: 0x02,
  BITSTRING: 0x03,
  OCTETSTRING: 0x04,
  NULL: 0x05,
  OBJECTID: 0x06,
  SEQUENCE: 0x30
}

/**
 * Decoder class used to parse a Buffer object and allow the application
 * to retrieve the values encoded into it.
 *
 * This class is not available in the Public API. Instead, it is used as
 * the return value of the execution of one of the supported Decoders
 * exported by this package.
 */
export class Decoder {
  private value: Buffer
  private offset: number = 0

  public constructor(value: Buffer) {
    if (!Buffer.isBuffer(value)) {
      throw new TypeError('Invalid parameter "value".')
    }

    this.value = value
  }

  /**
   * Getter that exposes the underlying Buffer object
   * sectioned by the current tag.
   */
  public get data(): Buffer {
    return this.value
  }

  /**
   * Ignores any leading 0-bytes of the provided data.
   *
   * @param data - Data to be trimmed.
   * @returns Reference to the new position of the Buffer.
   */
  private trim(data: Buffer): Buffer {
    while (data[0] === 0) {
      data = data.slice(1)
    }

    return data
  }

  /**
   * Slices the value Buffer based on the length of the provided tag.
   *
   * @param tag Current tag being parsed.
   * @param type Denotes the tag type in the error message.
   * @returns Sliced section represented by the current tag.
   */
  private slice(tag: number, type: string): Buffer {
    if (this.value[this.offset++] !== tag) {
      throw new Error(`Node type is not ${type}.`)
    }

    // Gets the length of the type.
    const length = decodeLength(this.value.subarray(this.offset))

    // Displaces the offset if the length is in Long Form.
    if (this.value[this.offset] & 0x80) {
      this.offset += 1 + (this.value[this.offset] & 0x7f)
    } else {
      this.offset++
    }

    // Retrieves the section of the data that represents the requested type.
    const buffer = this.trim(
      this.value.subarray(this.offset, this.offset + length)
    )

    // Sets the data to be itself minus the selected data and resets the offset.
    this.value = this.trim(this.value.slice(this.offset + length))
    this.offset = 0

    return buffer
  }

  /**
   * Abstraction of tags that do not do any post processings on its data.
   *
   * @param tag Tag passed to the slice method.
   * @param type Tag name passed to the slice method.
   * @returns Tag data wrapped in a new Decoder object.
   */
  private wrapped(tag: number, type: string): Decoder {
    return new Decoder(this.slice(tag, type))
  }

  /**
   * Displaces the reference pointer by the number of requested bytes.
   *
   * This is primarily used by Elliptic Curves.
   *
   * @param bytes - Number of bytes to be displaced.
   */
  public displace(bytes: number): void {
    if (!Number.isInteger(bytes)) {
      throw new TypeError('Invalid parameter "bytes".')
    }

    this.value = this.data.subarray(bytes)
    this.offset = 0
  }

  /**
   * Returns a Decoder object representing the context specific tag.
   *
   * Since a Context-Specific tag is of the format `10XXXXXX`,
   * we only care about the last 5 bits.
   */
  public contextSpecific(
    typpedTag: number,
    optional: boolean = true
  ): Nullable<Decoder> {
    if (!Number.isInteger(typpedTag)) {
      throw new TypeError('Invalid parameter "typpedTag".')
    }

    if (typeof optional !== 'boolean') {
      throw new TypeError('Invalid parameter "optional".')
    }

    const tag = this.data[0] & 0x1f

    if (tag !== typpedTag) {
      if (optional) {
        return undefined
      }

      throw new Error(`Malformed data. Expected ${typpedTag}, got ${tag}.`)
    }

    return new Decoder(this.slice(this.data[0], 'Context Specific'))
  }

  /**
   * Parses an integer.
   */
  public integer(): bigint {
    if (!Integer.isInteger(this.value)) {
      throw new TypeError('Node is not an Integer.')
    }

    const buffer = this.slice(Tags.INTEGER, 'Integer')

    return fromBuffer(buffer, BigInt)
  }

  /**
   * Parses the data inside a BitString.
   */
  // TODO: It always adds a zero padding. Verify if it does not conflict with anything.
  public bitstring(): Decoder {
    if (!BitString.isBitString(this.value)) {
      throw new TypeError('Node is not a BitString.')
    }

    return this.wrapped(Tags.BITSTRING, 'BitString')
  }

  /**
   * Parses the data inside an OctetString.
   */
  public octetstring(): Decoder {
    if (!OctetString.isOctetString(this.value)) {
      throw new TypeError('Node is not an OctetString.')
    }

    return this.wrapped(Tags.OCTETSTRING, 'OctetString')
  }

  /**
   * Parses a NULL tag.
   */
  public null(): null {
    if (!Null.isNull(this.value)) {
      throw new TypeError('Node is not a Null.')
    }

    if (this.value[this.offset++] !== Tags.NULL) {
      throw new Error('Node type is not Null.')
    }

    this.value = this.value.slice(++this.offset)

    return null
  }

  /**
   * Parses the data of an ObjectId.
   */
  public objectid(): Buffer {
    if (!ObjectId.isObjectId(this.value)) {
      throw new TypeError('Node is not an ObjectId.')
    }

    return this.slice(Tags.OBJECTID, 'ObjectId')
  }

  /**
   * Parses the data inside a Sequence.
   */
  public sequence(): Decoder {
    if (!Sequence.isSequence(this.data)) {
      throw new TypeError('Node is not an Sequence.')
    }

    return this.wrapped(Tags.SEQUENCE, 'Sequence')
  }
}
