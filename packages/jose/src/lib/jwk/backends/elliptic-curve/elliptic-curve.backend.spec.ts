import { KeyObjectType, KeyType } from 'crypto';

import { EllipticCurve } from '../elliptic-curve.type';
import { EllipticCurveBackend } from './elliptic-curve.backend';
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

describe('Elliptic Curve JSON Web Key Backend', () => {
  const backend = new EllipticCurveBackend();

  describe('curves', () => {
    it('should have an attribute "curves" with the supported elliptic curves.', () => {
      expect(backend['curves']).toStrictEqual<Record<Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521'>, string>>({
        'P-256': 'prime256v1',
        'P-384': 'secp384r1',
        'P-521': 'secp521r1',
      });
    });
  });

  describe('load()', () => {
    it('should load the provided parameters into an elliptic curve json web key.', async () => {
      await expect(backend.load(publicParameters)).resolves.toBeInstanceOf(EllipticCurveKey);
    });
  });

  describe('generate()', () => {
    it('should throw when passing an unsupported elliptic curve.', async () => {
      // @ts-expect-error Unsupported Elliptic Curve.
      await expect(backend.generate({ curve: 'Ed25519' })).rejects.toThrow(
        new TypeError('Unsupported Elliptic Curve "Ed25519" for JSON Web Key Type "EC".'),
      );
    });

    it('should generate a p-256 elliptic curve json web key.', async () => {
      let key!: EllipticCurveKey;

      expect((key = await backend.generate({ curve: 'P-256' }))).toBeInstanceOf(EllipticCurveKey);
      expect(key.crv).toEqual<EllipticCurve>('P-256');
    });

    it('should generate a p-384 elliptic curve json web key.', async () => {
      let key!: EllipticCurveKey;

      expect((key = await backend.generate({ curve: 'P-384' }))).toBeInstanceOf(EllipticCurveKey);
      expect(key.crv).toEqual<EllipticCurve>('P-384');
    });

    it('should generate a p-521 elliptic curve json web key.', async () => {
      let key!: EllipticCurveKey;

      expect((key = await backend.generate({ curve: 'P-521' }))).toBeInstanceOf(EllipticCurveKey);
      expect(key.crv).toEqual<EllipticCurve>('P-521');
    });
  });

  describe('getCryptoKey()', () => {
    it('should generate a public elliptic curve key.', () => {
      const key = backend.getCryptoKey(publicParameters);

      expect(key.type).toEqual<KeyObjectType>('public');
      expect(key.asymmetricKeyType).toEqual<KeyType>('ec');
    });

    it('should generate a private elliptic curve key.', () => {
      const key = backend.getCryptoKey(privateParameters);

      expect(key.type).toEqual<KeyObjectType>('private');
      expect(key.asymmetricKeyType).toEqual<KeyType>('ec');
    });
  });

  describe('getPrivateParameters()', () => {
    it('should return ["d"].', () => {
      expect(backend.getPrivateParameters()).toEqual<string[]>(['d']);
    });
  });

  describe('getThumbprintParameters()', () => {
    it('should return an object with the parameters ["crv", "kty", "x", "y"] in this exact order.', () => {
      const parameters = Object.keys(backend['getThumbprintParameters'](publicParameters));
      expect(parameters).toEqual<string[]>(['crv', 'kty', 'x', 'y']);
    });
  });
});
