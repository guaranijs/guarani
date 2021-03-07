import { Primitives } from '@guarani/utils'
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

export class Decoder {
  private offset: number = 0

  public constructor (private value: Buffer) {}

  public get data (): Buffer {
    return this.value
  }

  private trim (data: Buffer): Buffer {
    while (data[0] === 0) data = data.slice(1)
    return data
  }

  private slice (tag: number, type: string): Buffer {
    if (this.value[this.offset++] !== tag) {
      throw new Error(`Node type is not ${type}.`)
    }

    // Gets the length of the type.
    const length = decodeLength(this.value.subarray(this.offset))

    // Displaces the offset if the length is in Long Form.
    if (this.value[this.offset] & 0x80) this.offset += 1 + (this.value[this.offset] & 0x7f)
    else this.offset++

    // Retrieves the section of the data that represents the requested type.
    const buffer = this.trim(this.value.subarray(this.offset, this.offset + length))

    // Sets the data to be itself minus the selected data and resets the offset.
    this.value = this.trim(this.value.slice(this.offset + length))
    this.offset = 0

    return buffer
  }

  private wrapped (tag: number, type: string): Decoder {
    return new Decoder(this.slice(tag, type))
  }

  // Primarily used in elliptic curves.
  public displace (bytes: number): void {
    this.value = this.data.subarray(bytes)
    this.offset = 0
  }

  // Since a Context-Specific tag is of the format: 10XXXXXX,
  // we only care about the last 5 bits.
  public contextSpecific (typpedTag: number, optional: boolean = true): Decoder {
    const actualTag = this.data[0] & 0x1f

    if (actualTag !== typpedTag) {
      if (optional) return undefined
      throw new Error(`Malformed data. Expected ${typpedTag}, got ${actualTag}.`)
    }

    return new Decoder(this.slice(this.data[0], 'Context Specific'))
  }

  public integer (): bigint {
    const buffer = this.slice(Tags.INTEGER, 'Integer')
    return Primitives.fromBuffer(buffer, 'integer') as bigint
  }

  // TODO: It always adds a zero padding. Verify if it does not conflict with anything.
  public bitstring (): Decoder {
    return this.wrapped(Tags.BITSTRING, 'BitString')
  }

  public octetstring (): Decoder {
    return this.wrapped(Tags.OCTETSTRING, 'OctetString')
  }

  public null (): null {
    if (this.value[this.offset++] !== Tags.NULL) throw new Error('Node type is not Null.')
    this.value = this.value.slice(++this.offset)
    return null
  }

  public objectid (): Buffer {
    return this.slice(Tags.OBJECTID, 'ObjectId')
  }

  public sequence (): Decoder {
    return this.wrapped(Tags.SEQUENCE, 'Sequence')
  }
}
