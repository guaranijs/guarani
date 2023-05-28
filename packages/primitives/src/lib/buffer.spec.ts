import { Buffer } from 'buffer';

import { bitstringToBuffer, bufferToBitstring, bufferToInteger } from '../lib/buffer';

describe('bufferToBitstring()', () => {
  it.each([
    [[], ''],
    [[0x00], '00000000'],
    [[0x01], '00000001'],
    [[0x7f], '01111111'],
    [[0x80], '10000000'],
    [[0x81], '10000001'],
    [[0xff], '11111111'],
  ])('should convert a buffer into a bitstring.', (bytes, binary) => {
    expect(bufferToBitstring(Buffer.from(bytes))).toEqual(binary);
  });
});

describe('bitstringToBuffer()', () => {
  it('should throw when not providing a valid bitstring.', () => {
    expect(() => bitstringToBuffer('a')).toThrow(new TypeError('The parameter "bitstring" is not a valid bitstring.'));
  });

  it.each([
    ['', []],
    ['00000000', [0x00]],
    ['00000001', [0x01]],
    ['01111111', [0x7f]],
    ['10000000', [0x80]],
    ['10000001', [0x81]],
    ['11111111', [0xff]],
  ])('should convert a bitstring into a buffer.', (binary, bytes) => {
    expect(bitstringToBuffer(binary)).toEqual(Buffer.from(bytes));
  });
});

describe('bufferToInteger()', () => {
  it('should throw when the provided buffer has no bytes.', () => {
    expect(() => bufferToInteger(Buffer.alloc(0))).toThrow(new TypeError('The provided buffer must not be empty.'));
  });

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
