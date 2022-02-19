import { integerToBuffer } from '@guarani/primitives'

export function paddBuffer(data: Buffer, length: number): Buffer {
  while (data.length < length) {
    data = Buffer.concat([integerToBuffer(0x00), data])
  }

  return data
}
