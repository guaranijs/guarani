import { Primitives } from '@guarani/utils'
import { encodeLength } from '../../_utils'
import { Node } from './node'

export class ContextSpecific extends Node {
  protected value: Buffer

  public constructor (
    tagNumber: number,
    encoding: 'primitive' | 'constructed',
    value: Buffer
  ) {
    super()

    const tag = (0x80 | (encoding === 'constructed' ? 0x20 : 0x00)) | (tagNumber & 0x1f)
    this.value = Buffer.concat([Primitives.toBuffer(tag), encodeLength(value.length), value])
  }
}
