import { Nodes } from '../lib'

describe('ASN.1 BitString Type', () => {
  it('should encode a Buffer into a BitString type.', () => {
    expect(
      new Nodes.BitString(Buffer.from([0x02, 0x0d, 0x4f, 0x9e, 0xb3])).encode()
    ).toEqual(Buffer.from([0x03, 0x06, 0x00, 0x02, 0x0d, 0x4f, 0x9e, 0xb3]))
  })
})

describe('ASN.1 Boolean Type', () => {
  it('should encode true into a Boolean type.', () => {
    expect(new Nodes.Boolean(true).encode()).toEqual(
      Buffer.from([0x01, 0x01, 0x01])
    )
  })

  it('should encode false into a Boolean type.', () => {
    expect(new Nodes.Boolean(false).encode()).toEqual(
      Buffer.from([0x01, 0x01, 0x00])
    )
  })
})

describe('ASN.1 ContextSpecific Type', () => {
  it('should encode a Buffer into a ContextSpecific type.', () => {
    expect(
      new Nodes.ContextSpecific(
        0x00,
        'constructed',
        Buffer.from([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23])
      ).encode()
    ).toEqual(
      Buffer.from([0xa0, 0x07, 0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23])
    )
  })
})

describe('ASN.1 Integer Type', () => {
  it('should encode an integer into an Integer type.', () => {
    expect(new Nodes.Integer(65537).encode()).toEqual(
      Buffer.from([0x02, 0x03, 0x01, 0x00, 0x01])
    )
  })
})

describe('ASN.1 Null Type', () => {
  it('should encode a Null type.', () => {
    expect(new Nodes.Null().encode()).toEqual(Buffer.from([0x05, 0x00]))
  })
})

describe('ASN.1 ObjectId Type', () => {
  it('should encode a dotted integer string into an ObjectId type.', () => {
    expect(new Nodes.ObjectId('1.2.840.113549').encode()).toEqual(
      Buffer.from([0x06, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d])
    )
  })

  it('should encode an integer array into an ObjectId type.', () => {
    expect(new Nodes.ObjectId([1, 2, 840, 113549]).encode()).toEqual(
      Buffer.from([0x06, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d])
    )
  })
})

describe('ASN.1 OctetString Type', () => {
  it('should encode a Buffer into an OctetString type.', () => {
    expect(
      new Nodes.OctetString(Buffer.from([0x02, 0x0d, 0x4f, 0x9e])).encode()
    ).toEqual(Buffer.from([0x04, 0x04, 0x02, 0x0d, 0x4f, 0x9e]))
  })
})

describe('ASN.1 Sequence Type', () => {
  it('should encode a Buffer into an Sequence type.', () => {
    expect(new Nodes.Sequence(new Nodes.Integer(65537)).encode()).toEqual(
      Buffer.from([0x30, 0x05, 0x02, 0x03, 0x01, 0x00, 0x01])
    )
  })
})
