import { InvalidJsonWebKeyException } from '../../../lib/exceptions/invalid-json-web-key.exception';
import { UnsupportedAlgorithmException } from '../../../lib/exceptions/unsupported-algorithm.exception';
import { RsaKeyParams } from '../../../lib/jwk/algorithms/rsa/rsa-key.params';
import { RsaKey } from '../../../lib/jwk/algorithms/rsa/rsa.key';
import { ExportRsaKeyEncoding } from '../../../lib/jwk/algorithms/rsa/types/export-rsa-key-encoding';
import { ExportRsaKeyFormat } from '../../../lib/jwk/algorithms/rsa/types/export-rsa-key-format';
import { ExportRsaKeyType } from '../../../lib/jwk/algorithms/rsa/types/export-rsa-key-type';
import { ExportRsaKeyOptions } from '../../../lib/jwk/algorithms/rsa/types/export-rsa-key.options';
import { loadDerRsaKey, loadJwkRsaKey, loadPemRsaKey } from '../../keys/rsa/load-rsa-key';

const invalidKtys: any[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol.for('a'), () => {}, {}, []];

const invalidPubNums: any[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol.for('a'), () => {}, {}, []];

const invalidPrivNums: any[] = [null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol.for('a'), () => {}, {}, []];

const invalidModuli: any[] = [undefined, null, true, 1.2, 1n, 'a', Buffer.alloc(1), Symbol.for('a'), () => {}, {}, []];

const invalidPublicExponents: any[] = [null, true, 1.2, 1n, 'a', Buffer.alloc(1), Symbol.for('a'), () => {}, {}, []];

describe('RSA Key', () => {
  describe('constructor', () => {
    const privateJson = loadJwkRsaKey('private');
    const publicJson = loadJwkRsaKey('private');

    it.each(invalidKtys)('should reject an invalid "kty".', (invalidKty) => {
      expect(() => new RsaKey({ ...publicJson, kty: invalidKty })).toThrow(InvalidJsonWebKeyException);
    });

    it('should reject a JSON Web Key Type other than "RSA".', () => {
      // @ts-expect-error Wrong JSON Web Key Type.
      expect(() => new RsaKey({ ...publicJson, kty: 'wrong' })).toThrow(UnsupportedAlgorithmException);
    });

    it.each(invalidPubNums)('should reject an invalid "n".', (invalidPublicNumber) => {
      expect(() => new RsaKey({ ...publicJson, n: invalidPublicNumber })).toThrow(InvalidJsonWebKeyException);
    });

    it('should reject a public exponent smaller than 2048 bits.', () => {
      expect(() => new RsaKey({ kty: 'RSA', n: '', e: '' })).toThrow(InvalidJsonWebKeyException);
    });

    it.each(invalidPubNums)('should reject an invalid "e".', (invalidPublicNumber) => {
      expect(() => new RsaKey({ ...publicJson, e: invalidPublicNumber })).toThrow(InvalidJsonWebKeyException);
    });

    it.each(invalidPrivNums)('should reject an invalid "d".', (invalidPrivateNumber) => {
      expect(() => new RsaKey({ ...publicJson, d: invalidPrivateNumber })).toThrow(InvalidJsonWebKeyException);
    });

    it.each(invalidPrivNums)('should reject an invalid "p".', (invalidPrivateNumber) => {
      expect(() => new RsaKey({ ...privateJson, p: invalidPrivateNumber })).toThrow(InvalidJsonWebKeyException);
    });

    it.each(invalidPrivNums)('should reject an invalid "q".', (invalidPrivateNumber) => {
      expect(() => new RsaKey({ ...privateJson, q: invalidPrivateNumber })).toThrow(InvalidJsonWebKeyException);
    });

    it.each(invalidPrivNums)('should reject an invalid "dp".', (invalidPrivateNumber) => {
      expect(() => new RsaKey({ ...privateJson, dp: invalidPrivateNumber })).toThrow(InvalidJsonWebKeyException);
    });

    it.each(invalidPrivNums)('should reject an invalid "dq".', (invalidPrivateNumber) => {
      expect(() => new RsaKey({ ...privateJson, dq: invalidPrivateNumber })).toThrow(InvalidJsonWebKeyException);
    });

    it.each(invalidPrivNums)('should reject an invalid "qi".', (invalidPrivateNumber) => {
      expect(() => new RsaKey({ ...privateJson, qi: invalidPrivateNumber })).toThrow(InvalidJsonWebKeyException);
    });
  });

  describe('generate', () => {
    it.each(invalidModuli)('should reject an invalid "modulus".', (invalidModulus) => {
      expect(RsaKey.generate({ modulus: invalidModulus })).rejects.toThrow(TypeError);
    });

    it('should reject a Modulus smaller than 2048 bits.', () => {
      expect(RsaKey.generate({ modulus: 256 })).rejects.toThrow(Error);
    });

    it.each(invalidPublicExponents)('should reject an invalid "publicExponent".', (invalidPublicExponent) => {
      expect(RsaKey.generate({ modulus: 2048, publicExponent: invalidPublicExponent })).rejects.toThrow(TypeError);
    });

    it('should generate an Elliptic Curve JSON Web Key.', () => {
      expect(RsaKey.generate({ modulus: 2048 })).resolves.toMatchObject<RsaKeyParams>({
        kty: 'RSA',
        n: expect.any(String),
        e: expect.any(String),
        d: expect.any(String),
        p: expect.any(String),
        q: expect.any(String),
        dp: expect.any(String),
        dq: expect.any(String),
        qi: expect.any(String),
      });
    });
  });

  describe('export', () => {
    const privateJson = loadJwkRsaKey('private');
    const publicJson = loadJwkRsaKey('public');

    const privateDerPkcs1 = loadDerRsaKey('pkcs1', 'private');
    const privateDerPkcs8 = loadDerRsaKey('pkcs8', 'private');
    const publicDerPkcs1 = loadDerRsaKey('pkcs1', 'public');
    const publicDerSpki = loadDerRsaKey('spki', 'public');

    const privatePemPkcs1 = loadPemRsaKey('pkcs1', 'private');
    const privatePemPkcs8 = loadPemRsaKey('pkcs8', 'private');
    const publicPemPkcs1 = loadPemRsaKey('pkcs1', 'public');
    const publicPemSpki = loadPemRsaKey('spki', 'public');

    const keyExports: [
      RsaKeyParams,
      ExportRsaKeyOptions<ExportRsaKeyEncoding, ExportRsaKeyFormat, ExportRsaKeyType>,
      string | Buffer
    ][] = [
      [privateJson, { encoding: 'der', format: 'pkcs1', type: 'private' }, privateDerPkcs1],
      [privateJson, { encoding: 'der', format: 'pkcs8', type: 'private' }, privateDerPkcs8],
      [publicJson, { encoding: 'der', format: 'pkcs1', type: 'public' }, publicDerPkcs1],
      [publicJson, { encoding: 'der', format: 'spki', type: 'public' }, publicDerSpki],
      [privateJson, { encoding: 'pem', format: 'pkcs1', type: 'private' }, privatePemPkcs1],
      [privateJson, { encoding: 'pem', format: 'pkcs8', type: 'private' }, privatePemPkcs8],
      [publicJson, { encoding: 'pem', format: 'pkcs1', type: 'public' }, publicPemPkcs1],
      [publicJson, { encoding: 'pem', format: 'spki', type: 'public' }, publicPemSpki],
    ];

    const invalidExportOptions: any[] = [
      undefined,
      null,
      true,
      1,
      1.2,
      1n,
      Buffer.alloc(1),
      Symbol.for('foo'),
      () => {},
      {},
      [],
      'wrong',
    ];

    const invalidExportCombinations: [ExportRsaKeyType, ExportRsaKeyFormat][] = [
      ['public', 'pkcs8'],
      ['private', 'spki'],
    ];

    it.each(invalidExportOptions)('should reject exporting with invalid encoding option.', (invalidEncoding) => {
      expect(() => {
        return new RsaKey(publicJson).export({ encoding: invalidEncoding, format: 'pkcs1', type: 'private' });
      }).toThrow(TypeError);
    });

    it.each(invalidExportOptions)('should reject exporting with invalid format option.', (invalidFormat) => {
      expect(() => {
        return new RsaKey(publicJson).export({ encoding: 'der', format: invalidFormat, type: 'private' });
      }).toThrow(TypeError);
    });

    it.each(invalidExportOptions)('should reject exporting with invalid type option.', (invalidType) => {
      expect(() => {
        return new RsaKey(publicJson).export({ encoding: 'der', format: 'pkcs1', type: invalidType });
      }).toThrow(TypeError);
    });

    it.each(invalidExportCombinations)('should reject an invalid export options combination.', (type, format) => {
      // @ts-expect-error Invalid Export Options combination.
      expect(() => new RsaKey(publicJson).export({ encoding: 'der', format, type })).toThrow(TypeError);
    });

    it('should reject exporting private data from a public key.', () => {
      expect(() => {
        return new RsaKey(publicJson).export({ encoding: 'der', format: 'pkcs1', type: 'private' });
      }).toThrow(TypeError);
    });

    it.each(keyExports)('should export an RSA JSON Web Key.', (params, options, expectedResult) => {
      // @ts-expect-error Export Options overload.
      expect(new RsaKey(params).export(options)).toEqual(expectedResult);
    });
  });
});
