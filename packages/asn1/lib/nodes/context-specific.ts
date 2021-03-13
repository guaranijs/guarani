import { Primitives } from '@guarani/utils'

import { encodeLength } from '../_utils'
import { Node } from './node'

/**
 * Transforms an ASN.1 type into its Context-Specific version, which consists of
 * changing the 3 MSBs of the tag number to represent a new value.
 *
 * @example
 * const ctx = new ContextSpecific(
 *   0x00,
 *   'constructed',
 *   new ObjectId('1.3.132.0.35').encode()
 * )
 * ctx.encode() // <Buffer a0 07 06 05 2b 81 04 00 23>
 */
export class ContextSpecific extends Node {
  private tagNumber: number
  private encoding: 'primitive' | 'constructed'
  private value: Buffer

  public constructor(
    tagNumber: number,
    encoding: 'primitive' | 'constructed',
    value: Buffer
  ) {
    super()

    if (typeof tagNumber !== 'number')
      throw new TypeError('Invalid parameter "tagNumber".')

    if (!['primitive', 'constructed'].includes(encoding))
      throw new TypeError('Invalid parameter "encoding".')

    if (!Buffer.isBuffer(value))
      throw new TypeError('Invalid parameter "value".')

    this.tagNumber = tagNumber
    this.encoding = encoding
    this.value = value
  }

  /**
   * Encodes the provided value into a ContextSpecific type Buffer.
   *
   * @returns Encoded data enveloped in a ContextSpecific type.
   *
   * @example
   * const ctx = new ContextSpecific(
   *   0x00,
   *   'constructed',
   *   new ObjectId('1.3.132.0.35').encode()
   * )
   * ctx.encode() // <Buffer a0 07 06 05 2b 81 04 00 23>
   */
  public encode(): Buffer {
    const tag =
      0x80 |
      (this.encoding === 'constructed' ? 0x20 : 0x00) |
      (this.tagNumber & 0x1f)

    return Buffer.concat([
      Primitives.toBuffer(tag),
      encodeLength(this.value.length),
      this.value
    ])
  }
}
