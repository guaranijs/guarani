import { Primitives } from '../lib'

describe('Operations to and from primitive types', () => {
  it('should transform an integer into a Buffer.', () => {
    expect(Primitives.toBuffer(65537)).toEqual(Buffer.from([0x01, 0x00, 0x01]))
  })

  it('should transform a Buffer into an integer.', () => {
    expect(Primitives.fromBuffer(Buffer.from([0x01, 0x00, 0x01]), 'integer')).toEqual(65537n)
  })

  it('should transform a string into a Buffer.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21])
    expect(Primitives.toBuffer('Hello!')).toEqual(buffer)
  })

  it('should transform a Buffer into a string.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21])
    expect(Primitives.fromBuffer(buffer, 'string')).toEqual('Hello!')
  })
})
