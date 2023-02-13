import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../exceptions/invalid-jsonwebsignature.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebKeyType } from '../jwk/jsonwebkey-type.enum';
import { JsonWebSignature } from './jsonwebsignature';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature-algorithm.enum';
import { JsonWebSignatureHeader } from './jsonwebsignature.header';

const invalidTokens: unknown[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer.alloc(1), () => 1, {}, []];
const invalidTokenFormats: string[] = ['', 'a', '.a', '.a.b', 'a.b', 'a.b.c.d'];

const invalidKeys: unknown[] = [undefined, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(1), {}, []];

const header = new JsonWebSignatureHeader({ alg: JsonWebSignatureAlgorithm.HS256 });
const payload = Buffer.from('{"iat": 1723010455, "sub": "078BWDDXasdcg8"}', 'utf8');
const signature = Buffer.from('hRqmKz7sKWQZyNM1Kw9AgqPNOedszPvEADYmNFo8foA', 'base64url');

const key = new JsonWebKey({ kty: JsonWebKeyType.Octet, k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ' });

const token =
  'eyJhbGciOiJIUzI1NiJ9.' +
  'eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0.' +
  'hRqmKz7sKWQZyNM1Kw9AgqPNOedszPvEADYmNFo8foA';

describe('JSON Web Signature', () => {
  describe('constructor', () => {
    it('should throw when the provided payload is invalid.', () => {
      // @ts-expect-error Invalid Payload
      expect(() => new JsonWebSignature(header, { sub: 'user-id' })).toThrow(
        new TypeError('Invalid JSON Web Signature Payload.')
      );
    });

    it('should create an instance of a json web signature.', () => {
      expect(new JsonWebSignature(header)).toMatchObject({ header, payload: Buffer.alloc(0) });
      expect(new JsonWebSignature(header, payload)).toMatchObject({ header, payload });
    });
  });

  describe('decode()', () => {
    it.each(invalidTokens)('should throw when the provided token is invalid.', (invalidToken) => {
      // @ts-expect-error Invalid Type
      expect(() => JsonWebSignature.decode(invalidToken)).toThrow(new InvalidJsonWebSignatureException());
    });

    it.each(invalidTokenFormats)('should throw when the format of the provided token is invalid.', (invalidToken) => {
      expect(() => JsonWebSignature.decode(invalidToken)).toThrow(new InvalidJsonWebSignatureException());
    });

    it('should throw when the header of the token is not a valid json object.', () => {
      expect(() => JsonWebSignature.decode('a.b.c')).toThrow(InvalidJsonWebSignatureException);
    });

    it('should decode the data of a valid token.', () => {
      expect(JsonWebSignature.decode(token)).toEqual([header, payload, signature]);
    });
  });

  describe('verify()', () => {
    it.each(invalidKeys)('should throw when the provided json web key is invalid.', async (invalidKey) => {
      // @ts-expect-error Invalid Type
      await expect(JsonWebSignature.verify(token, invalidKey)).rejects.toThrow(new InvalidJsonWebKeyException());
    });

    it('should throw when the algorithm of the token does not match the expected algorithms.', async () => {
      await expect(JsonWebSignature.verify(token, key, [JsonWebSignatureAlgorithm.RS256])).rejects.toThrow(
        new InvalidJsonWebSignatureException(
          'The JSON Web Signature Algorithm "HS256" does not match the expected algorithms.'
        )
      );
    });

    it('should return the decoded json web signature.', async () => {
      await expect(JsonWebSignature.verify(token, key)).resolves.toMatchObject({ header, payload });
    });
  });

  describe('sign()', () => {
    it('should sign a json web signature object into a compact token.', async () => {
      const jws = new JsonWebSignature(header, payload);
      await expect(jws.sign(key)).resolves.toBe(token);
    });
  });
});
