import { Buffer } from 'buffer';

import { integerToBuffer } from '../lib/integer';

describe('integerToBuffer()', () => {
  it.each([
    [0n, [0x00]],
    [1n, [0x01]],
    [127n, [0x7f]],
    [128n, [0x80]],
    [129n, [0x81]],
    [255n, [0xff]],
    [256n, [0x01, 0x00]],
    [257n, [0x01, 0x01]],
  ])('should convert a positive integer into a buffer.', (integer, array) => {
    expect(integerToBuffer(integer)).toEqual(Buffer.from(array));
  });

  it.each([
    [0n, [0x00]],
    [1n, [0x01]],
    [127n, [0x7f]],
    [128n, [0x00, 0x80]],
    [129n, [0x00, 0x81]],
    [255n, [0x00, 0xff]],
    [256n, [0x01, 0x00]],
    [257n, [0x01, 0x01]],
  ])("should convert a positive integer into a two's complement buffer.", (integer, array) => {
    expect(integerToBuffer(integer, true)).toEqual(Buffer.from(array));
  });

  it.each([
    [-0n, [0x00]],
    [-1n, [0xff]],
    [-127n, [0x81]],
    [-128n, [0x80]],
    [-129n, [0xff, 0x7f]],
    [-255n, [0xff, 0x01]],
    [-256n, [0xff, 0x00]],
    [-257n, [0xfe, 0xff]],
  ])("should convert a negative integer into a two's complemented buffer.", (integer, array) => {
    expect(integerToBuffer(integer)).toEqual(Buffer.from(array));
  });

  it.each([
    [-0n, [0x00]],
    [-1n, [0xff]],
    [-127n, [0x81]],
    [-128n, [0x80]],
    [-129n, [0xff, 0x7f]],
    [-255n, [0xff, 0x01]],
    [-256n, [0xff, 0x00]],
    [-257n, [0xfe, 0xff]],
  ])("should convert a negative integer into a two's complemented buffer.", (integer, array) => {
    expect(integerToBuffer(integer, true)).toEqual(Buffer.from(array));
  });
});
