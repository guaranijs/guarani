import { decode } from '../lib/decode';

describe('decode()', () => {
  it.each([
    ['AA', 0x00n],
    ['AQ', 0x01n],
    ['fw', 0x7fn],
    ['gA', 0x80n],
    ['gQ', 0x81n],
    ['_w', 0xffn],
    ['AQA', 0x0100n],
    ['AQE', 0x0101n],
    ['_wA', 0xff00n],
    ['_wE', 0xff01n],
    ['_38', 0xff7fn],
    ['__8', 0xffffn],
    ['AQAA', 0x010000n],
    ['AQAB', 0x010001n],
  ])('should decode a Base64Url String into an unsigned Integer.', (b64url, integer) => {
    expect(decode(b64url, BigInt)).toEqual(integer);
  });

  it.each([
    ['AA', 0x00n],
    ['AQ', 0x01n],
    ['fw', 0x7fn],
    ['AIA', 0x80n],
    ['AIE', 0x81n],
    ['AP8', 0xffn],
    ['AQA', 0x0100n],
    ['AQE', 0x0101n],
    ['AP8A', 0xff00n],
    ['AP8B', 0xff01n],
    ['AP9_', 0xff7fn],
    ['AP__', 0xffffn],
    ['AQAA', 0x010000n],
    ['AQAB', 0x010001n],
  ])('should decode a Base64Url String into a positive Integer.', (b64url, integer) => {
    expect(decode(b64url, BigInt, true)).toEqual(integer);
  });

  it.each([
    ['AA', -0x00n],
    ['_w', -0x01n],
    ['gQ', -0x7fn],
    ['gA', -0x80n],
    ['_38', -0x81n],
    ['_wE', -0xffn],
    ['_wA', -0x0100n],
    ['_v8', -0x0101n],
  ])('should decode a Base64Url String into a negative Integer.', (b64url, integer) => {
    expect(decode(b64url, BigInt, true)).toEqual(integer);
  });

  it('should decode a Base64Url String into a Buffer.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21]);
    expect(decode('SGVsbG8h', Buffer)).toEqual(buffer);
  });

  it('should convert a Base64Url String into a Base64 String.', () => {
    expect(decode('qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ', String)).toEqual(
      'qDM80igvja4Tg/tNsEuWDhl2bMM6/NgJEldFhIEuwqQ='
    );
  });
});
