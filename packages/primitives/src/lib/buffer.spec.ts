import {
  binaryToBuffer,
  bufferToBinary,
  bufferToInteger,
  bufferToUnsignedInteger,
  flipBufferBits,
  padBits,
} from '../lib/buffer';

describe('binaryToBuffer()', () => {
  it.each([
    ['00000000', [0x00]],
    ['00000001', [0x01]],
    ['01111111', [0x7f]],
    ['10000000', [0x80]],
    ['10000001', [0x81]],
    ['11111111', [0xff]],
  ])('should convert a binary string into a buffer.', (binary, bytes) => {
    expect(binaryToBuffer(binary)).toEqual(Buffer.from(bytes));
  });
});

describe('bufferToBinary()', () => {
  it.each([
    [[0x00], '00000000'],
    [[0x01], '00000001'],
    [[0x7f], '01111111'],
    [[0x80], '10000000'],
    [[0x81], '10000001'],
    [[0xff], '11111111'],
  ])('should convert a binary string into a buffer.', (bytes, binary) => {
    expect(bufferToBinary(Buffer.from(bytes))).toEqual(binary);
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

describe('flipBufferBits()', () => {
  it.each([
    [[0x00], [0xff]],
    [[0x01], [0xfe]],
    [[0x7f], [0x80]],
    [[0x80], [0x7f]],
    [[0x81], [0x7e]],
    [[0xfe], [0x01]],
    [[0xff], [0x00]],
  ])('should return the complement of the provided buffer.', (bytes, complementBytes) => {
    expect(flipBufferBits(Buffer.from(bytes))).toEqual(Buffer.from(complementBytes));
  });
});

describe('padBits()', () => {
  it.each([
    ['1', '00000001'],
    ['11', '00000011'],
    ['111', '00000111'],
    ['1111', '00001111'],
    ['11111', '00011111'],
    ['111111', '00111111'],
    ['1111111', '01111111'],
    ['11111111', '11111111'],
  ])("should pad a bitstring until it's length is a multiple of 8.", (bitstring, expected) => {
    expect(padBits(bitstring)).toEqual(expected);
  });
});
