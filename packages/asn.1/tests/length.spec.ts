import { decodeLength, encodeLength } from '../lib/length';

describe('encodeLength()', () => {
  it('should encode lengths smaller than 0x80 into one byte.', () => {
    expect(encodeLength(0x0c)).toEqual(Buffer.from([0x0c]));
    expect(encodeLength(0x7f)).toEqual(Buffer.from([0x7f]));
  });

  it('should encode lengths smaller than 0x80 into multiple bytes.', () => {
    expect(encodeLength(0x0c, true)).toEqual(Buffer.from([0x81, 0x0c]));
    expect(encodeLength(0x7f, true)).toEqual(Buffer.from([0x81, 0x7f]));
  });

  it('should encode lengths greater than or equal to 0x80 into multiple bytes.', () => {
    expect(encodeLength(0x80)).toEqual(Buffer.from([0x81, 0x80]));
    expect(encodeLength(0x01f9)).toEqual(Buffer.from([0x82, 0x01, 0xf9]));
  });
});

describe('decodeLength()', () => {
  it('should decode Short Form lengths into their respective integers.', () => {
    expect(decodeLength(Buffer.from([0x0c]))).toEqual(0x0c);
    expect(decodeLength(Buffer.from([0x7f]))).toEqual(0x7f);
  });

  it('should decode Long Form lengths into their respective integers.', () => {
    expect(decodeLength(Buffer.from([0x81, 0x80]))).toEqual(0x80);
    expect(decodeLength(Buffer.from([0x82, 0x01, 0xf9]))).toEqual(0x01f9);
  });
});
