import { Buffer } from 'buffer';
import { KeyObjectType as CryptoKeyObjectType, KeyType as CryptoKeyType } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { UnsupportedEllipticCurveException } from '../../../exceptions/unsupported-elliptic-curve.exception';
import { EllipticCurve } from '../elliptic-curve.type';
import { OctetKeyPairKey } from './octet-key-pair.key';
import { OctetKeyPairKeyParameters } from './octet-key-pair.key.parameters';

const publicParameters: OctetKeyPairKeyParameters = {
  kty: 'OKP',
  crv: 'Ed25519',
  x: 'aNoALKSUE1UsotuZvHUj1HEGqhpzLtsSTLmkBITDMAk',
};

const privateParameters: OctetKeyPairKeyParameters = {
  ...publicParameters,
  d: 'tccuS3jrlRwPaNsn2YxpUuMCqvnlsIgy_T0S7qVmo-A',
};

const invalidCurves: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Buffer,
  Buffer.alloc(1),
  Symbol('foo'),
  () => 1,
  {},
  [],
];

const invalidPublicValues: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Buffer,
  Buffer.alloc(1),
  Symbol('foo'),
  () => 1,
  {},
  [],
];

const invalidPrivateValues: any[] = [null, true, 1, 1.2, 1n, Buffer, Buffer.alloc(1), Symbol('foo'), () => 1, {}, []];

describe('Octet Key Pair Key', () => {
  describe('constructor', () => {
    it('should throw when providing a "kty" different than "OKP".', () => {
      // @ts-expect-error Invalid JSON Web Key Type.
      expect(() => new OctetKeyPairKey({ kty: 'unknown' })).toThrow(
        new TypeError('Unexpected JSON Web Key Type "unknown" for OctetKeyPairKey.')
      );
    });

    it.each(invalidCurves)('should throw when passing an invalid curve type.', (crv) => {
      expect(() => new OctetKeyPairKey({ ...publicParameters, crv })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "crv".')
      );
    });

    it('should throw when passing an unsupported curve.', () => {
      // @ts-expect-error Invalid parameter "crv".
      expect(() => new OctetKeyPairKey({ ...publicParameters, crv: 'unknown' })).toThrow(
        new UnsupportedEllipticCurveException('Invalid jwk parameter "crv".')
      );
    });

    it.each(invalidPublicValues)('should throw when passing an invalid public value.', (x) => {
      expect(() => new OctetKeyPairKey({ ...publicParameters, x })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "x".')
      );
    });

    it.each(invalidPrivateValues)('should throw when passing an invalid private value.', (d) => {
      expect(() => new OctetKeyPairKey({ ...privateParameters, d })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "d".')
      );
    });

    it('should create an octet key pair public key.', () => {
      let key!: OctetKeyPairKey;

      expect(() => (key = new OctetKeyPairKey(publicParameters))).not.toThrow();

      expect(key).toMatchObject(publicParameters);

      const { cryptoKey } = key;

      expect(cryptoKey.asymmetricKeyType).toEqual<CryptoKeyType>('ed25519');
      expect(cryptoKey.type).toEqual<CryptoKeyObjectType>('public');
    });

    it('should create an octet key pair private key.', () => {
      let key!: OctetKeyPairKey;

      expect(() => (key = new OctetKeyPairKey(privateParameters))).not.toThrow();

      expect(key).toMatchObject(privateParameters);

      const { cryptoKey } = key;

      expect(cryptoKey.asymmetricKeyType).toEqual<CryptoKeyType>('ed25519');
      expect(cryptoKey.type).toEqual<CryptoKeyObjectType>('private');
    });
  });

  describe('supportedEllipticCurves', () => {
    it('should have ["Ed25519", "Ed448", "X25519", "X448"] as its value.', () => {
      const key = new OctetKeyPairKey(publicParameters);

      expect(key.supportedEllipticCurves).toEqual<Extract<EllipticCurve, 'Ed25519' | 'Ed448' | 'X25519' | 'X448'>[]>([
        'Ed25519',
        'Ed448',
        'X25519',
        'X448',
      ]);
    });
  });

  describe('getThumbprintParameters()', () => {
    it('should return an object with the parameters ["crv", "kty", "x"] in this exact order.', () => {
      const key = new OctetKeyPairKey(publicParameters);
      const parameters = Object.keys(key['getThumbprintParameters']());

      expect(parameters).toEqual<string[]>(['crv', 'kty', 'x']);
    });
  });

  describe('getPrivateParameters()', () => {
    it('should return ["d"].', () => {
      const key = new OctetKeyPairKey(publicParameters);
      expect(key['getPrivateParameters']()).toEqual<string[]>(['d']);
    });
  });
});
