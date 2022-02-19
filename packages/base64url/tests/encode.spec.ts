import { encode } from '../lib/encode';

describe('encode()', () => {
  it.each([
    [0x00n, 'AA'],
    [0x01n, 'AQ'],
    [0x7fn, 'fw'],
    [0x80n, 'gA'],
    [0x81n, 'gQ'],
    [0xffn, '_w'],
    [0x0100n, 'AQA'],
    [0x0101n, 'AQE'],
    [0xff00n, '_wA'],
    [0xff01n, '_wE'],
    [0xff7fn, '_38'],
    [0xffffn, '__8'],
    [0x010000n, 'AQAA'],
    [0x010001n, 'AQAB'],
  ])('should encode an unsigned Integer into a Base64Url String.', (integer, result) => {
    expect(encode(integer)).toEqual(result);
  });

  it.each([
    [0x00n, 'AA'],
    [0x01n, 'AQ'],
    [0x7fn, 'fw'],
    [0x80n, 'AIA'],
    [0x81n, 'AIE'],
    [0xffn, 'AP8'],
    [0x0100n, 'AQA'],
    [0x0101n, 'AQE'],
    [0xff00n, 'AP8A'],
    [0xff01n, 'AP8B'],
    [0xff7fn, 'AP9_'],
    [0xffffn, 'AP__'],
    [0x010000n, 'AQAA'],
    [0x010001n, 'AQAB'],
  ])('should encode a positive Integer into a Base64Url String.', (integer, result) => {
    expect(encode(integer, true)).toEqual(result);
  });

  it.each([
    [-0x00n, 'AA'],
    [-0x01n, '_w'],
    [-0x7fn, 'gQ'],
    [-0x80n, 'gA'],
    [-0x81, '_38'],
    [-0xff, '_wE'],
    [-0x0100n, '_wA'],
    [-0x0101n, '_v8'],
  ])('should encode a negative Integer into a Base64Url String.', (integer, result) => {
    expect(encode(integer)).toEqual(result);
  });

  it('should encode a Buffer into a Base64Url String.', () => {
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21]);
    expect(encode(buffer)).toEqual('SGVsbG8h');
  });

  it('should convert a Base64 String into a Base64Url String.', () => {
    expect(encode('qDM80igvja4Tg/tNsEuWDhl2bMM6/NgJEldFhIEuwqQ=')).toEqual(
      'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ'
    );
  });
});
