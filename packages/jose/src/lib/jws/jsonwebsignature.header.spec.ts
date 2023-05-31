import 'jest-extended';

import { Buffer } from 'buffer';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebSignatureHeader } from './jsonwebsignature.header';
import { JsonWebSignatureHeaderParameters } from './jsonwebsignature.header.parameters';

const invalidAlgs: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];

describe('JSON Web Signature Header', () => {
  describe('isValidHeader()', () => {
    it.each(invalidAlgs)('should return false when the provided header parameter "alg" is invalid.', (alg) => {
      expect(JsonWebSignatureHeader.isValidHeader({ alg })).toBeFalse();
    });

    it('should return false when the provided header parameter "alg" is unsupported.', () => {
      expect(JsonWebSignatureHeader.isValidHeader({ alg: 'unknown' })).toBeFalse();
    });

    it('should return true when the provided data is a valid json web signature header.', () => {
      expect(JsonWebSignatureHeader.isValidHeader({ alg: 'HS256' })).toBeTrue();
    });
  });

  describe('constructor', () => {
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

    it('should create an instance of a json web signature header.', () => {
      const parameters: JsonWebSignatureHeaderParameters = { alg: 'HS256' };
      expect(new JsonWebSignatureHeader(parameters)).toMatchObject(parameters);
    });
  });
});
