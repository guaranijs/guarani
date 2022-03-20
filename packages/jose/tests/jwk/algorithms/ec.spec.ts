import { InvalidJsonWebKeyException } from '../../../lib/exceptions/invalid-json-web-key.exception';
import { UnsupportedAlgorithmException } from '../../../lib/exceptions/unsupported-algorithm.exception';
import { UnsupportedEllipticCurveException } from '../../../lib/exceptions/unsupported-elliptic-curve.exception';
import { EcKeyParams } from '../../../lib/jwk/algorithms/ec/ec-key.params';
import { EcKey } from '../../../lib/jwk/algorithms/ec/ec.key';
import { ExportEcKeyEncoding } from '../../../lib/jwk/algorithms/ec/types/export-ec-key-encoding';
import { ExportEcKeyFormat } from '../../../lib/jwk/algorithms/ec/types/export-ec-key-format';
import { ExportEcKeyType } from '../../../lib/jwk/algorithms/ec/types/export-ec-key-type';
import { ExportEcKeyOptions } from '../../../lib/jwk/algorithms/ec/types/export-ec-key.options';
import {
  loadDerEllipticCurveKey,
  loadJwkEllipticCurveKey,
  loadPemEllipticCurveKey,
} from '../../keys/ec/load-elliptic-curve-key';

const invalidKtys: any[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol.for('foo'), () => {}, {}, []];

const invalidCurves: any[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol.for('foo'), () => {}, {}, []];

const invalidCoords: any[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol.for('foo'), () => {}, {}, []];

const invalidPrivateKeys: any[] = [null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol.for('foo'), () => {}, {}, []];

describe('Elliptic Curve Key', () => {
  describe('constructor', () => {
    it.each(invalidKtys)('should reject an invalid "kty".', (invalidKty) => {
      expect(() => new EcKey({ kty: invalidKty, crv: 'P-256', x: '', y: '' })).toThrow(InvalidJsonWebKeyException);
    });

    it('should reject a JSON Web Key Type other than "EC".', () => {
      // @ts-expect-error Wrong JSON Web Key Type.
      expect(() => new EcKey({ kty: 'wrong', crv: 'P-256', x: '', y: '' })).toThrow(UnsupportedAlgorithmException);
    });

    it.each(invalidCurves)('should reject an invalid "crv".', (invalidCurve) => {
      expect(() => new EcKey({ kty: 'EC', crv: invalidCurve, x: '', y: '' })).toThrow(InvalidJsonWebKeyException);
    });

    it('should reject an unsupported Elliptic Curve.', () => {
      // @ts-expect-error Unsupported Elliptic Curve.
      expect(() => new EcKey({ kty: 'EC', crv: 'wrong', x: '', y: '' })).toThrow(UnsupportedEllipticCurveException);
    });

    it.each(invalidCoords)('should reject an invalid "x".', (invalidCoordinate) => {
      expect(() => new EcKey({ kty: 'EC', crv: 'P-256', x: invalidCoordinate, y: '' }));
    });

    it.each(invalidCoords)('should reject an invalid "y".', (invalidCoordinate) => {
      expect(() => new EcKey({ kty: 'EC', crv: 'P-256', x: '', y: invalidCoordinate }));
    });

    it.each(invalidPrivateKeys)('should reject an invalid "d".', (invalidPrivateKey) => {
      expect(() => new EcKey({ kty: 'EC', crv: 'P-256', x: '', y: '', d: invalidPrivateKey }));
    });
  });

  describe('generate', () => {
    it.each(invalidCurves)('should reject an invalid Elliptic Curve', (invalidCurve) => {
      expect(EcKey.generate({ curve: invalidCurve })).rejects.toThrow(TypeError);
    });

    it('should reject an unsupported Elliptic Curve.', () => {
      // @ts-expect-error Unsupported Elliptic Curve.
      expect(EcKey.generate({ curve: 'wrong' })).rejects.toThrow(UnsupportedEllipticCurveException);
    });

    it('should generate an Elliptic Curve JSON Web Key.', () => {
      expect(EcKey.generate({ curve: 'P-256' })).resolves.toMatchObject<EcKeyParams>({
        kty: 'EC',
        crv: 'P-256',
        x: expect.any(String),
        y: expect.any(String),
        d: expect.any(String),
      });
    });
  });

  describe('export', () => {
    const privateJson = loadJwkEllipticCurveKey('private');
    const publicJson = loadJwkEllipticCurveKey('public');

    const privateDerSec1 = loadDerEllipticCurveKey('sec1', 'private');
    const privateDerPkcs8 = loadDerEllipticCurveKey('pkcs8', 'private');
    const publicDerSpki = loadDerEllipticCurveKey('spki', 'public');

    const privatePemSec1 = loadPemEllipticCurveKey('sec1', 'private');
    const privatePemPkcs8 = loadPemEllipticCurveKey('pkcs8', 'private');
    const publicPemSpki = loadPemEllipticCurveKey('spki', 'public');

    const keyExports: [
      EcKeyParams,
      ExportEcKeyOptions<ExportEcKeyEncoding, ExportEcKeyFormat, ExportEcKeyType>,
      string | Buffer
    ][] = [
      [privateJson, { encoding: 'der', format: 'sec1', type: 'private' }, privateDerSec1],
      [privateJson, { encoding: 'der', format: 'pkcs8', type: 'private' }, privateDerPkcs8],
      [publicJson, { encoding: 'der', format: 'spki', type: 'public' }, publicDerSpki],
      [privateJson, { encoding: 'pem', format: 'sec1', type: 'private' }, privatePemSec1],
      [privateJson, { encoding: 'pem', format: 'pkcs8', type: 'private' }, privatePemPkcs8],
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

    const invalidExportCombinations: [ExportEcKeyType, ExportEcKeyFormat][] = [
      ['public', 'sec1'],
      ['public', 'pkcs8'],
      ['private', 'spki'],
    ];

    it.each(invalidExportOptions)('should reject exporting with invalid encoding option.', (invalidEncoding) => {
      expect(() => {
        return new EcKey(publicJson).export({ encoding: invalidEncoding, format: 'sec1', type: 'private' });
      }).toThrow(TypeError);
    });

    it.each(invalidExportOptions)('should reject exporting with invalid format option.', (invalidFormat) => {
      expect(() => {
        return new EcKey(publicJson).export({ encoding: 'der', format: invalidFormat, type: 'private' });
      }).toThrow(TypeError);
    });

    it.each(invalidExportOptions)('should reject exporting with invalid type option.', (invalidType) => {
      expect(() => {
        return new EcKey(publicJson).export({ encoding: 'der', format: 'sec1', type: invalidType });
      }).toThrow(TypeError);
    });

    it.each(invalidExportCombinations)('should reject an invalid export options combination.', (type, format) => {
      // @ts-expect-error Invalid Export Options combination.
      expect(() => new EcKey(publicJson).export({ encoding: 'der', format, type })).toThrow(TypeError);
    });

    it('should reject exporting private data from a public key.', () => {
      expect(() => {
        return new EcKey(publicJson).export({ encoding: 'der', format: 'sec1', type: 'private' });
      }).toThrow(TypeError);
    });

    it.each(keyExports)('should export an Elliptic Curve JSON Web Key.', (params, options, expectedResult) => {
      // @ts-expect-error Export Options overload.
      expect(new EcKey(params).export(options)).toEqual(expectedResult);
    });
  });
});
