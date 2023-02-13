import { Buffer } from 'buffer';
import { KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { UnsupportedEllipticCurveException } from '../../../exceptions/unsupported-elliptic-curve.exception';
import { EcKeyBackend } from './eckey.backend';
import { EcKeyParameters } from './eckey.parameters';

const publicParameters: EcKeyParameters = {
  kty: 'EC',
  crv: 'P-256',
  x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
  y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
};

const privateParameters: EcKeyParameters = { ...publicParameters, d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo' };

const invalidCurves: unknown[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol('foo'), () => 1, {}, []];
const invalidCoords: unknown[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol('foo'), () => 1, {}, []];
const invalidPrivateValues: unknown[] = [null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol('foo'), () => 1, {}, []];

const backend = new EcKeyBackend();

describe('JSON Web Key Elliptic Curve Backend', () => {
  describe('privateParameters', () => {
    it('should have ["d"] as its value.', () => {
      expect(backend.privateParameters).toEqual(['d']);
    });
  });

  describe('load()', () => {
    it('should throw when not providing the parameter "crv".', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { crv, ...missingParameters } = publicParameters;

      expect(() => backend.load({ ...missingParameters })).toThrow(
        new InvalidJsonWebKeyException('The provided parameters do not represent a valid "EC" key.')
      );
    });

    it('should throw when not providing the parameter "x".', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { x, ...missingParameters } = publicParameters;

      expect(() => backend.load({ ...missingParameters })).toThrow(
        new InvalidJsonWebKeyException('The provided parameters do not represent a valid "EC" key.')
      );
    });

    it('should throw when not providing the parameter "y".', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { y, ...missingParameters } = publicParameters;

      expect(() => backend.load({ ...missingParameters })).toThrow(
        new InvalidJsonWebKeyException('The provided parameters do not represent a valid "EC" key.')
      );
    });

    it.each(invalidCurves)('should throw when passing an invalid curve type.', (crv) => {
      expect(() => backend.load({ ...publicParameters, crv })).toThrow(
        new InvalidJsonWebKeyException('Invalid parameter "crv".')
      );
    });

    it('should throw when passing an unsupported curve.', () => {
      expect(() => backend.load({ ...publicParameters, crv: 'unknown' })).toThrow(
        new UnsupportedEllipticCurveException('Unsupported Elliptic Curve "unknown".')
      );
    });

    it.each(invalidCoords)('should throw when passing an invalid x coordinate.', (x) => {
      expect(() => backend.load({ ...publicParameters, x })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "x".')
      );
    });

    it.each(invalidCoords)('should throw when passing an invalid y coordinate.', (y) => {
      expect(() => backend.load({ ...publicParameters, y })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "y".')
      );
    });

    it.each(invalidPrivateValues)('should throw when passing an invalid private value.', (d) => {
      expect(() => backend.load({ ...publicParameters, d })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "d".')
      );
    });

    it('should load a public elliptic curve crypto key.', () => {
      let publicKey!: KeyObject;

      expect(() => (publicKey = backend.load(publicParameters))).not.toThrow();
      expect(publicKey.asymmetricKeyType).toBe('ec');
      expect(publicKey.type).toBe('public');
    });

    it('should load a private elliptic curve crypto key.', () => {
      let privateKey!: KeyObject;

      expect(() => (privateKey = backend.load(privateParameters))).not.toThrow();
      expect(privateKey.asymmetricKeyType).toBe('ec');
      expect(privateKey.type).toBe('private');
    });
  });
});
