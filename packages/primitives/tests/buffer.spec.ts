import { bufferToInteger, bufferToUnsignedInteger, flipBufferBits } from '../lib/buffer';

describe('flipBufferBits()', () => {
  it.each([
    [[0x00], [0xff]],
    [[0x01], [0xfe]],
    [[0x7f], [0x80]],
    [[0x80], [0x7f]],
    [[0x81], [0x7e]],
    [[0xfe], [0x01]],
    [[0xff], [0x00]],
  ])('should return the complement of the provided Buffer.', (bytes, complementBytes) => {
    expect(flipBufferBits(Buffer.from(bytes))).toEqual(Buffer.from(complementBytes));
  });
});

describe('bufferToUnsignedInteger()', () => {
  it.each([
    [[0x00], 0n],
    [[0x01], 1n],
    [[0x7f], 127n],
    [[0x80], 128n],
    [[0x81], 129n],
    [[0xff], 255n],
    [[0x01, 0x00], 256n],
    [[0x01, 0x01], 257n],
    [[0xff, 0x7f], 65407n],
    [[0xff, 0x01], 65281n],
    [[0xff, 0x00], 65280n],
  ])('should convert a buffer into an unsigned integer.', (bytes, unsignedInteger) => {
    expect(bufferToUnsignedInteger(Buffer.from(bytes))).toEqual(unsignedInteger);
  });
});

describe('bufferToInteger()', () => {
  it.each([
    [[0x00], 0n],
    [[0x01], 1n],
    [[0x7f], 127n],
    [[0x80], 128n],
    [[0x81], 129n],
    [[0xff], 255n],
    [[0x01, 0x00], 256n],
    [[0x01, 0x01], 257n],
    [[0xff, 0x7f], 65407n],
    [[0xff, 0x01], 65281n],
    [[0xff, 0x00], 65280n],
  ])('should convert a buffer into a positive integer.', (bytes, integer) => {
    expect(bufferToInteger(Buffer.from(bytes))).toEqual(integer);
  });

  it.each([
    [[0x00], 0n],
    [[0x01], 1n],
    [[0x7f], 127n],
    [[0x00, 0x80], 128n],
    [[0x00, 0x81], 129n],
    [[0x00, 0xff], 255n],
    [[0x01, 0x00], 256n],
    [[0x01, 0x01], 257n],
    [[0x00, 0xff, 0x7f], 65407n],
    [[0x00, 0xff, 0x01], 65281n],
    [[0x00, 0xff, 0x00], 65280n],
  ])("should convert a two's complemented buffer into a positive integer.", (bytes, integer) => {
    expect(bufferToInteger(Buffer.from(bytes), true)).toEqual(integer);
  });

  it.each([
    [[0x00], -0n],
    [[0xff], -1n],
    [[0x81], -127n],
    [[0x80], -128n],
    [[0xff, 0x7f], -129n],
    [[0xff, 0x01], -255n],
    [[0xff, 0x00], -256n],
    [[0xfe, 0xff], -257n],
  ])("should convert a two's complemented buffer into a negative integer.", (bytes, integer) => {
    expect(bufferToInteger(Buffer.from(bytes), true)).toEqual(integer);
  });
});
