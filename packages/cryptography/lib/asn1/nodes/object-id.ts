import { Primitives } from '@guarani/utils'
import { encodeLength } from '../../_utils'
import { Node } from './node'

export class ObjectId extends Node {
  protected value: Buffer

  public constructor (value: string) {
    super()

    const values = value.split(/[\s.]+/g).map(e => Number.parseInt(e))

    if (values.length < 2) {
      throw new Error('There MUST be AT LEAST two values.')
    }

    if (values.some(e => e < 0)) {
      throw new Error('The OID CANNOT have negative integers.')
    }

    if (![0, 1, 2].includes(values[0])) {
      throw new Error('The first value MUST be between 0 and 2.')
    }

    if (values[0] < 2 && values[1] >= 40) {
      throw new Error('The second value is outside of range.')
    }

    const firstByte = Primitives.toBuffer(40 * values[0] + values[1])
    const bytes: Buffer[] = []

    for (let i = values.length - 1; i > 1; i--) {
      let element = values[i]
      bytes.push(Primitives.toBuffer(element & 0x7f))
      while ((element >>>= 7) > 0) bytes.push(Primitives.toBuffer(0x80 | (element & 0x7f)))
    }

    const buffer = Buffer.concat([firstByte, ...bytes.reverse()])
    const length = encodeLength(buffer.length)

    this.value = Buffer.concat([Primitives.toBuffer(0x06), length, buffer])
  }
}
