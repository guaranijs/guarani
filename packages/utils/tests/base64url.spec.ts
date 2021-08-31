import {
  base64UrlBufferLength,
  base64UrlDecode,
  base64UrlDecodeInt,
  base64UrlEncode,
  base64UrlEncodeInt,
  base64UrltoBase64,
  base64toBase64Url
} from '../lib/base64url'

describe('Base64 URL functionalities', () => {
  it('should encode a Buffer into a Base64 URL string.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21])
    expect(base64UrlEncode(buffer)).toEqual('SGVsbG8h')
  })

  it('should decode a Base64 URL string into a Buffer.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21])
    expect(base64UrlDecode('SGVsbG8h')).toEqual(buffer)
  })

  it('should encode an integer into a Base64 URL string.', () => {
    expect(base64UrlEncodeInt(65537)).toEqual('AQAB')
  })

  it('should decode a Base64 URL string into an integer.', () => {
    expect(base64UrlDecodeInt('AQAB')).toEqual(BigInt(65537))
  })

  it('should convert a Base64 string into a Base64Url string.', () => {
    expect(
      base64toBase64Url('qDM80igvja4Tg/tNsEuWDhl2bMM6/NgJEldFhIEuwqQ=')
    ).toEqual('qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ')
  })

  it('should convert a Base64Url string into a Base64 string.', () => {
    expect(
      base64UrltoBase64('qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ')
    ).toEqual('qDM80igvja4Tg/tNsEuWDhl2bMM6/NgJEldFhIEuwqQ=')
  })

  it('should return the length of the Buffer of a Base64Url string.', () => {
    expect(base64UrlBufferLength('AQAB')).toBe(3)
  })
})
