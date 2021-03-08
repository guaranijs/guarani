import { Base64Url } from '../lib'

describe('Base64 URL functionalities', () => {
  it('should encode a Buffer into a Base64 URL string.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21])
    expect(Base64Url.encode(buffer)).toEqual('SGVsbG8h')
  })

  it('should decode a Base64 URL string into a Buffer.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21])
    expect(Base64Url.decode('SGVsbG8h')).toEqual(buffer)
  })

  it('should encode an integer into a Base64 URL string.', () => {
    expect(Base64Url.encodeInt(65537)).toEqual('AQAB')
  })

  it('should decode a Base64 URL string into an integer.', () => {
    expect(Base64Url.decodeInt('AQAB')).toEqual(65537n)
  })

  it('should convert a Base64 string into a Base64Url string.', () => {
    expect(Base64Url.fromBase64('qDM80igvja4Tg/tNsEuWDhl2bMM6/NgJEldFhIEuwqQ='))
      .toEqual('qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ')
  })

  it('should convert a Base64Url string into a Base64 string.', () => {
    expect(Base64Url.toBase64('qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ'))
      .toEqual('qDM80igvja4Tg/tNsEuWDhl2bMM6/NgJEldFhIEuwqQ=')
  })
})
