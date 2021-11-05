import { b64Length, decode, encode } from '../base64url'

describe('Base64 URL functionalities', () => {
  it('should encode a Buffer into a Base64 URL string.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21])
    expect(encode(buffer)).toEqual('SGVsbG8h')
  })

  it('should decode a Base64 URL string into a Buffer.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21])
    expect(decode('SGVsbG8h', Buffer)).toEqual(buffer)
  })

  it('should encode an integer into a Base64 URL string.', () => {
    expect(encode(65537)).toEqual('AQAB')
    expect(encode(65537n)).toEqual('AQAB')
  })

  it('should decode a Base64 URL string into an integer.', () => {
    expect(decode('AQAB', BigInt)).toEqual(65537n)
    expect(decode('AQAB', Number)).toEqual(65537)
  })

  it('should convert a Base64 string into a Base64Url string.', () => {
    expect(encode('qDM80igvja4Tg/tNsEuWDhl2bMM6/NgJEldFhIEuwqQ=')).toEqual(
      'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ'
    )
  })

  it('should convert a Base64Url string into a Base64 string.', () => {
    expect(
      decode('qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ', String)
    ).toEqual('qDM80igvja4Tg/tNsEuWDhl2bMM6/NgJEldFhIEuwqQ=')
  })

  it('should return the length of the Buffer of a Base64Url string.', () => {
    expect(b64Length('AQAB')).toBe(3)
  })
})
