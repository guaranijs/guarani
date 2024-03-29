import { Buffer } from 'buffer';
import { KeyObjectType as CryptoKeyObjectType, KeyType as CryptoKeyType } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { UnsupportedEllipticCurveException } from '../../../exceptions/unsupported-elliptic-curve.exception';
import { EllipticCurve } from '../elliptic-curve.type';
import { EllipticCurveKey } from './elliptic-curve.key';
import { EllipticCurveKeyParameters } from './elliptic-curve.key.parameters';

const publicParameters: EllipticCurveKeyParameters = {
  kty: 'EC',
  crv: 'P-256',
  x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
  y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
};

const privateParameters: EllipticCurveKeyParameters = {
  ...publicParameters,
  d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
};

const invalidCurves: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Symbol('foo'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  {},
  [],
];

const invalidCoordinates: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Symbol('foo'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  {},
  [],
];

const invalidPrivateValues: any[] = [true, 1, 1.2, 1n, Symbol('foo'), Buffer, Buffer.alloc(1), () => 1, {}, []];

describe('Elliptic Curve Key', () => {
  describe('constructor', () => {
    it('should throw when providing a "kty" different than "EC".', () => {
      // @ts-expect-error Invalid JSON Web Key Type.
      expect(() => new EllipticCurveKey({ kty: 'unknown' })).toThrow(
        new TypeError('Invalid jwk parameter "kty". Expected "EC", got "unknown".'),
      );
    });

    it.each(invalidCurves)('should throw when passing an invalid curve type.', (crv) => {
      expect(() => new EllipticCurveKey({ ...publicParameters, crv })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "crv".'),
      );
    });

    it('should throw when passing an unsupported curve.', () => {
      // @ts-expect-error Invalid parameter "crv".
      expect(() => new EllipticCurveKey({ ...publicParameters, crv: 'unknown' })).toThrow(
        new UnsupportedEllipticCurveException('Invalid jwk parameter "crv".'),
      );
    });

    it.each(invalidCoordinates)('should throw when passing an invalid x coordinate.', (x) => {
      expect(() => new EllipticCurveKey({ ...publicParameters, x })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "x".'),
      );
    });

    it.each(invalidCoordinates)('should throw when passing an invalid y coordinate.', (y) => {
      expect(() => new EllipticCurveKey({ ...publicParameters, y })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "y".'),
      );
    });

    it.each(invalidPrivateValues)('should throw when passing an invalid private value.', (d) => {
      expect(() => new EllipticCurveKey({ ...privateParameters, d })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "d".'),
      );
    });

    it('should create an elliptic curve public key.', () => {
      let key!: EllipticCurveKey;

      expect(() => (key = new EllipticCurveKey(publicParameters))).not.toThrow();

      expect(key).toMatchObject(publicParameters);

      const { cryptoKey } = key;

      expect(cryptoKey.asymmetricKeyType).toEqual<CryptoKeyType>('ec');
      expect(cryptoKey.type).toEqual<CryptoKeyObjectType>('public');
    });

    it('should create an elliptic curve private key.', () => {
      let key!: EllipticCurveKey;

      expect(() => (key = new EllipticCurveKey(privateParameters))).not.toThrow();

      expect(key).toMatchObject(privateParameters);

      const { cryptoKey } = key;

      expect(cryptoKey.asymmetricKeyType).toEqual<CryptoKeyType>('ec');
      expect(cryptoKey.type).toEqual<CryptoKeyObjectType>('private');
    });
  });

  describe('supportedEllipticCurves', () => {
    it('should have ["P-256", "P-384", "P-521"] as its value.', () => {
      const key = new EllipticCurveKey(publicParameters);

      expect(key.supportedEllipticCurves).toEqual<Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521'>[]>([
        'P-256',
        'P-384',
        'P-521',
      ]);
    });
  });
});
