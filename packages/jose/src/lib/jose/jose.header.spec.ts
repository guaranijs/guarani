import { Buffer } from 'buffer';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { JoseHeader } from './jose.header';
import { JoseHeaderParameters } from './jose.header.parameters';

const invalidJoseHeaders: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  'a',
  Symbol('a'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  [],
];

const invalidJkus: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidJwks: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidKids: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidX5Us: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidX5Cs: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidX5Ts: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidX5TS256s: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidCrits: any[] = [
  null,
  true,
  1,
  1.2,
  1n,
  Symbol('a'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  {},
  [],
  [null],
  [true],
  [1],
  [1.2],
  [1n],
  [Symbol('a')],
  [Buffer],
  [Buffer.alloc(1)],
  [() => 1],
  [{}],
  [[]],
];

describe('JOSE Header', () => {
  describe('isValidHeader()', () => {
    it('should return true if the provided data is an instance of JoseHeader.', () => {
      expect(JoseHeader.isValidHeader(Reflect.construct(JoseHeader, [{}]))).toBeTrue();
    });

    it.each(invalidJoseHeaders)('should return false if the provided data is not a plain object.', (header) => {
      return expect(JoseHeader.isValidHeader(header)).toBeFalse();
    });

    it('should return true if the provided data is a plain object.', () => {
      expect(JoseHeader.isValidHeader({})).toBeTrue();
    });
  });

  describe('constructor', () => {
    it.each(invalidJkus)('should throw when providing the unsupported parameter "jku".', (jku) => {
      expect(() => Reflect.construct(JoseHeader, [{ jku }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "jku".'),
      );
    });

    it.each(invalidJwks)('should throw when providing the unsupported parameter "jwk".', (jwk) => {
      expect(() => Reflect.construct(JoseHeader, [{ jwk }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "jwk".'),
      );
    });

    it.each(invalidKids)('should throw when the provided header parameter "kid" is invalid.', (kid) => {
      expect(() => Reflect.construct(JoseHeader, [{ kid }])).toThrow(
        new InvalidJoseHeaderException('Invalid header parameter "kid".'),
      );
    });

    it.each(invalidX5Us)('should throw when providing the unsupported parameter "x5u".', (x5u) => {
      expect(() => Reflect.construct(JoseHeader, [{ x5u }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "x5u".'),
      );
    });

    it.each(invalidX5Cs)('should throw when providing the unsupported parameter "x5c".', (x5c) => {
      expect(() => Reflect.construct(JoseHeader, [{ x5c }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "x5c".'),
      );
    });

    it.each(invalidX5Ts)('should throw when providing the unsupported parameter "x5t".', (x5t) => {
      expect(() => Reflect.construct(JoseHeader, [{ x5t }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "x5t".'),
      );
    });

    it.each(invalidX5TS256s)('should throw when providing the unsupported parameter "x5t#S256".', (x5tS256) => {
      expect(() => Reflect.construct(JoseHeader, [{ 'x5t#S256': x5tS256 }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "x5t#S256".'),
      );
    });

    it.each(invalidCrits)('should throw when the providing an invalid "crit" parameter.', (crit) => {
      expect(() => Reflect.construct(JoseHeader, [{ crit }])).toThrow(
        new InvalidJoseHeaderException('Invalid header parameter "crit".'),
      );
    });

    it('should throw when the header parameter defined at "crit" is not provided.', () => {
      expect(() => Reflect.construct(JoseHeader, [{ crit: ['kid'] }])).toThrow(
        new InvalidJoseHeaderException('Missing required header parameter "kid".'),
      );
    });

    it('should create an instance of a jose header.', () => {
      const parameters: JoseHeaderParameters = { cty: 'JWT', kid: 'jwk-id' };
      expect(Reflect.construct(JoseHeader, [parameters])).toMatchObject(parameters);
    });
  });
});
