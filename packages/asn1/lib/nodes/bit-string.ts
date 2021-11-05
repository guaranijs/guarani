import { toBuffer } from '@guarani/utils/primitives'

import { encodeLength } from '../_utils'
import { Node } from './node'

/**
 * The BitString type denotes an arbitrary string of bits (ones and zeroes).
 *
 * TAG Number: 0x03
 *
 * It is used for digital signatures on extended certificates in PKCS #6's
 * ExtendedCertificate type, for digital signatures on certificates in X.509's
 * Certificate type, and for public keys in certificates in X.509's
 * SubjectPublicKeyInfo type.
 *
 * The X.509's SubjectPublicKeyInfo type can be defined as:
 *
 * ```
 * SubjectPublicKeyInfo ::= SEQUENCE {
 *   algorithm AlgorithmIdentifier,
 *   publicKey BIT STRING
 * }
 * ```
 *
 * The BitString object is recognized by its padding performed on the data,
 * since it has to maintain it's length as a multiple of 8, it will pad the
 * MSBs of the data with zeros until its length reaches a multiple of 8.
 */
export class BitString extends Node {
  /**
   * Value representing the bitstring.
   */
  private readonly value: Buffer

  /**
   * Instantiates a new BitString object based on the provided value.
   *
   * @param value - Buffer representation of the BitString.
   */
  public constructor(value: Buffer) {
    super()

    if (!Buffer.isBuffer(value)) {
      throw new TypeError('Invalid parameter "value".')
    }

    this.value = value
  }

  /**
   * Checks whether the provided buffer is a BitString.
   *
   * @param buffer - Buffer to be checked.
   * @returns Whether or not the buffer is a BitString.
   */
  public static isBitString(buffer: Buffer): boolean {
    return buffer[0] === 0x03
  }

  /**
   * Encodes the provided value into a BitString type Buffer.
   *
   * @returns Encoded data enveloped in a BitString type.
   *
   * @example
   * const bitstr = new BitString(Buffer.from([0x02, 0x0d, 0x4f, 0x9e, 0xb3]))
   * bitstr.encode() // <Buffer 03 06 00 02 0d 4f 9e b3>
   */
  public encode(): Buffer {
    // TODO: Check if, when the value of bin(value) % 8 is 0, we need to add the padding.
    return Buffer.concat([
      toBuffer(0x03),
      encodeLength(this.value.length + 1),
      toBuffer(0x00),
      this.value
    ])
  }
}
