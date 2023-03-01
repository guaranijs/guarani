import { Buffer } from 'buffer';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebEncryptionHeader } from './jsonwebencryption.header';
import { JsonWebEncryptionHeaderParameters } from './jsonwebencryption.header.parameters';

const invalidAlgs: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidEncs: any[] = [...invalidAlgs];
const invalidZips: any[] = [...invalidAlgs.slice(1)];
const invalidKids: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidCrits: any[] = [...invalidKids, ...invalidKids.map((value) => ['kid', value])];

const invalidJkus: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidJwks: any[] = [...invalidJkus];
const invalidX5Us: any[] = [...invalidJkus];
const invalidX5Cs: any[] = [...invalidJkus];
const invalidX5Ts: any[] = [...invalidJkus];
const invalidX5TS256s: any[] = [...invalidJkus];

const parameters: JsonWebEncryptionHeaderParameters = {
  alg: 'A128KW',
  enc: 'A128CBC-HS256',
};

describe('JSON Web Encryption Header', () => {
  it('should throw when no "alg" or "enc". is provided.', () => {
    // @ts-expect-error Invalid Type
    expect(() => new JsonWebEncryptionHeader({})).toThrow(
      new InvalidJoseHeaderException('The provided parameters do not represent a valid JSON Web Encryption Header.')
    );
  });

  it.each(invalidAlgs)('should throw when the provided header parameter "alg" is invalid.', (alg) => {
    expect(() => {
      return new JsonWebEncryptionHeader({ alg, enc: 'A128GCM' });
    }).toThrow(new InvalidJoseHeaderException('Invalid header parameter "alg".'));
  });

  it.each(invalidEncs)('should throw when the provided header parameter "enc" is invalid.', (enc) => {
    expect(() => new JsonWebEncryptionHeader({ alg: 'A128KW', enc })).toThrow(
      new InvalidJoseHeaderException('Invalid header parameter "enc".')
    );
  });

  it.each(invalidZips)('should throw when the provided header parameter "zip" is invalid.', (zip) => {
    expect(() => new JsonWebEncryptionHeader({ alg: 'A128KW', enc: 'A128GCM', zip })).toThrow(
      new InvalidJoseHeaderException('Invalid header parameter "zip".')
    );
  });

  it('should throw when the provided header parameter "alg" is unsupported.', () => {
    // @ts-expect-error Unsupported JSON Web Encryption Key Wrap Algorithm.
    expect(() => new JsonWebEncryptionHeader({ ...parameters, alg: 'unknown' })).toThrow(
      new UnsupportedAlgorithmException('Unsupported JSON Web Encryption Key Wrap Algorithm "unknown".')
    );
  });

  it('should throw when the provided header parameter "enc" is unsupported.', () => {
    // @ts-expect-error Unsupported JSON Web Encryption Content Encryption Algorithm.
    expect(() => new JsonWebEncryptionHeader({ ...parameters, enc: 'unknown' })).toThrow(
      new UnsupportedAlgorithmException('Unsupported JSON Web Encryption Content Encryption Algorithm "unknown".')
    );
  });

  it('should throw when the provided header parameter "zip" is unsupported.', () => {
    // @ts-expect-error Unsupported JSON Web Encryption Compression Algorithm.
    expect(() => new JsonWebEncryptionHeader({ ...parameters, zip: 'unknown' })).toThrow(
      new UnsupportedAlgorithmException('Unsupported JSON Web Encryption Compression Algorithm "unknown".')
    );
  });

  it.each(invalidJkus)('should throw when providing the unsupported parameter "jku".', (jku) => {
    expect(() => new JsonWebEncryptionHeader({ ...parameters, jku })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "jku".')
    );
  });

  it.each(invalidJwks)('should throw when providing the unsupported parameter "jwk".', (jwk) => {
    expect(() => new JsonWebEncryptionHeader({ ...parameters, jwk })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "jwk".')
    );
  });

  it.each(invalidKids)('should throw when the provided header parameter "kid" is invalid.', (kid) => {
    expect(() => new JsonWebEncryptionHeader({ ...parameters, kid })).toThrow(
      new InvalidJoseHeaderException('Invalid header parameter "kid".')
    );
  });

  it.each(invalidX5Us)('should throw when providing the unsupported parameter "x5u".', (x5u) => {
    expect(() => new JsonWebEncryptionHeader({ ...parameters, x5u })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "x5u".')
    );
  });

  it.each(invalidX5Cs)('should throw when providing the unsupported parameter "x5c".', (x5c) => {
    expect(() => new JsonWebEncryptionHeader({ ...parameters, x5c })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "x5c".')
    );
  });

  it.each(invalidX5Ts)('should throw when providing the unsupported parameter "x5t".', (x5t) => {
    expect(() => new JsonWebEncryptionHeader({ ...parameters, x5t })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "x5t".')
    );
  });

  it.each(invalidX5TS256s)('should throw when providing the unsupported parameter "x5t#S256".', (x5tS256) => {
    expect(() => new JsonWebEncryptionHeader({ ...parameters, 'x5t#S256': x5tS256 })).toThrow(
      new InvalidJoseHeaderException('Unsupported header parameter "x5t#S256".')
    );
  });

  it.each(invalidCrits)('should throw when the provided header parameter "crit" is invalid.', (crit) => {
    expect(() => new JsonWebEncryptionHeader({ ...parameters, crit })).toThrow(
      new InvalidJoseHeaderException('Invalid header parameter "crit".')
    );
  });

  it('should throw when the header parameter defined at "crit" is not provided.', () => {
    expect(() => new JsonWebEncryptionHeader({ ...parameters, crit: ['kid'] })).toThrow(
      new InvalidJoseHeaderException('Missing required header parameter "kid".')
    );
  });

  it('should create an instance of a json web encryption header.', () => {
    expect(new JsonWebEncryptionHeader(parameters)).toMatchObject(parameters);
  });
});
