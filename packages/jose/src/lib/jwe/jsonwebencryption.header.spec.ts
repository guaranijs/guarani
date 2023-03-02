import { Buffer } from 'buffer';

import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JsonWebEncryptionHeader } from './jsonwebencryption.header';
import { JsonWebEncryptionHeaderParameters } from './jsonwebencryption.header.parameters';

const invalidAlgs: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidEncs: any[] = [...invalidAlgs];
const invalidZips: any[] = [...invalidAlgs.slice(1)];

const parameters: JsonWebEncryptionHeaderParameters = {
  alg: 'A128KW',
  enc: 'A128CBC-HS256',
};

describe('JSON Web Encryption Header', () => {
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

  it('should create an instance of a json web encryption header.', () => {
    expect(new JsonWebEncryptionHeader(parameters)).toMatchObject(parameters);
  });
});
