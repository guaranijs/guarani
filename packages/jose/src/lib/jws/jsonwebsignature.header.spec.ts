import { Buffer } from 'buffer';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebSignatureHeader } from './jsonwebsignature.header';
import { JsonWebSignatureHeaderParameters } from './jsonwebsignature.header.parameters';

const invalidAlgs: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidKids: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidCrits: any[] = [...invalidKids, ...invalidKids.map((value) => ['kid', value])];

const invalidJkus: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidJwks: any[] = [...invalidJkus];
const invalidX5Us: any[] = [...invalidJkus];
const invalidX5Cs: any[] = [...invalidJkus];
const invalidX5Ts: any[] = [...invalidJkus];
const invalidX5TS256s: any[] = [...invalidJkus];

const parameters: JsonWebSignatureHeaderParameters = { alg: 'HS256' };

describe('JSON Web Signature Header', () => {
  it('should throw when no "alg" is provided.', () => {
    // @ts-expect-error Invalid Type
    expect(() => new JsonWebSignatureHeader({})).toThrow(
      new InvalidJoseHeaderException('The provided parameters do not represent a valid JSON Web Signature Header.')
    );
  });

  it.each(invalidAlgs)('should throw when the provided header parameter "alg" is invalid.', (alg) => {
    expect(() => new JsonWebSignatureHeader({ alg })).toThrow(
      new InvalidJoseHeaderException('Invalid header parameter "alg".')
    );
  });

  it('should throw when the provided header parameter "alg" is unsupported.', () => {
    // @ts-expect-error Unsupported JSON Web Signature Algorithm.
    expect(() => new JsonWebSignatureHeader({ alg: 'unknown' })).toThrow(
      new UnsupportedAlgorithmException('Unsupported JSON Web Signature Algorithm "unknown".')
    );
  });

  it.each(invalidJkus)('should throw when providing the unsupported parameter "jku".', (jku) => {
    expect(() => new JsonWebSignatureHeader({ ...parameters, jku })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "jku".')
    );
  });

  it.each(invalidJwks)('should throw when providing the unsupported parameter "jwk".', (jwk) => {
    expect(() => new JsonWebSignatureHeader({ ...parameters, jwk })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "jwk".')
    );
  });

  it.each(invalidKids)('should throw when the provided header parameter "kid" is invalid.', (kid) => {
    expect(() => new JsonWebSignatureHeader({ alg: 'none', kid })).toThrow(
      new InvalidJoseHeaderException('Invalid header parameter "kid".')
    );
  });

  it.each(invalidX5Us)('should throw when providing the unsupported parameter "x5u".', (x5u) => {
    expect(() => new JsonWebSignatureHeader({ ...parameters, x5u })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "x5u".')
    );
  });

  it.each(invalidX5Cs)('should throw when providing the unsupported parameter "x5c".', (x5c) => {
    expect(() => new JsonWebSignatureHeader({ ...parameters, x5c })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "x5c".')
    );
  });

  it.each(invalidX5Ts)('should throw when providing the unsupported parameter "x5t".', (x5t) => {
    expect(() => new JsonWebSignatureHeader({ ...parameters, x5t })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "x5t".')
    );
  });

  it.each(invalidX5TS256s)('should throw when providing the unsupported parameter "x5t#S256".', (x5tS256) => {
    expect(() => new JsonWebSignatureHeader({ ...parameters, 'x5t#S256': x5tS256 })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "x5t#S256".')
    );
  });

  it.each(invalidCrits)('should throw when the provided header parameter "crit" is invalid.', (crit) => {
    expect(() => new JsonWebSignatureHeader({ alg: 'none', crit })).toThrow(
      new InvalidJoseHeaderException('Invalid header parameter "crit".')
    );
  });

  it('should throw when the header parameter defined at "crit" is not provided.', () => {
    expect(() => new JsonWebSignatureHeader({ alg: 'none', crit: ['kid'] })).toThrow(
      new InvalidJoseHeaderException('Missing required header parameter "kid".')
    );
  });

  it('should create an instance of a json web signature header.', () => {
    expect(new JsonWebSignatureHeader(parameters)).toMatchObject(parameters);
  });
});
