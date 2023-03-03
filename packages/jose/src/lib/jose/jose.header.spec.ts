import { Buffer } from 'buffer';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { JoseHeader } from './jose.header';

describe('JOSE Header', () => {
  describe('constructor', () => {
    const invalidKids: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
    const invalidCrits: any[] = [...invalidKids, ...invalidKids.map((value) => ['kid', value])];

    const invalidJkus: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
    const invalidJwks: any[] = [...invalidJkus];
    const invalidX5Us: any[] = [...invalidJkus];
    const invalidX5Cs: any[] = [...invalidJkus];
    const invalidX5Ts: any[] = [...invalidJkus];
    const invalidX5TS256s: any[] = [...invalidJkus];

    it.each(invalidJkus)('should throw when providing the unsupported parameter "jku".', (jku) => {
      expect(() => Reflect.construct(JoseHeader, [{ jku }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "jku".')
      );
    });

    it.each(invalidJwks)('should throw when providing the unsupported parameter "jwk".', (jwk) => {
      expect(() => Reflect.construct(JoseHeader, [{ jwk }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "jwk".')
      );
    });

    it.each(invalidKids)('should throw when the provided header parameter "kid" is invalid.', (kid) => {
      expect(() => Reflect.construct(JoseHeader, [{ kid }])).toThrow(
        new InvalidJoseHeaderException('Invalid header parameter "kid".')
      );
    });

    it.each(invalidX5Us)('should throw when providing the unsupported parameter "x5u".', (x5u) => {
      expect(() => Reflect.construct(JoseHeader, [{ x5u }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "x5u".')
      );
    });

    it.each(invalidX5Cs)('should throw when providing the unsupported parameter "x5c".', (x5c) => {
      expect(() => Reflect.construct(JoseHeader, [{ x5c }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "x5c".')
      );
    });

    it.each(invalidX5Ts)('should throw when providing the unsupported parameter "x5t".', (x5t) => {
      expect(() => Reflect.construct(JoseHeader, [{ x5t }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "x5t".')
      );
    });

    it.each(invalidX5TS256s)('should throw when providing the unsupported parameter "x5t#S256".', (x5tS256) => {
      expect(() => Reflect.construct(JoseHeader, [{ 'x5t#S256': x5tS256 }])).toThrow(
        new InvalidJoseHeaderException('Unsupported header parameter "x5t#S256".')
      );
    });

    it.each(invalidCrits)('should throw when the provided header parameter "crit" is invalid.', (crit) => {
      expect(() => Reflect.construct(JoseHeader, [{ crit }])).toThrow(
        new InvalidJoseHeaderException('Invalid header parameter "crit".')
      );
    });

    it('should throw when the header parameter defined at "crit" is not provided.', () => {
      expect(() => Reflect.construct(JoseHeader, [{ crit: ['kid'] }])).toThrow(
        new InvalidJoseHeaderException('Missing required header parameter "kid".')
      );
    });
  });
});
