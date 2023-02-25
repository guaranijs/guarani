import { UnsupportedEllipticCurveException } from '../../../exceptions/unsupported-elliptic-curve.exception';
import { EllipticCurve } from '../elliptic-curve.type';
import { OctetKeyPairBackend } from './octet-key-pair.backend';
import { OctetKeyPairKey } from './octet-key-pair.key';
import { OctetKeyPairKeyParameters } from './octet-key-pair.key.parameters';

const publicParameters: OctetKeyPairKeyParameters = {
  kty: 'OKP',
  crv: 'Ed25519',
  x: 'aNoALKSUE1UsotuZvHUj1HEGqhpzLtsSTLmkBITDMAk',
};

describe('Octet Key Pair JSON Web Key Backend', () => {
  const backend = new OctetKeyPairBackend();

  describe('curves', () => {
    it('should have an attribute "curves" with the supported elliptic curves.', () => {
      expect(backend['curves']).toStrictEqual<
        Record<Extract<EllipticCurve, 'Ed25519' | 'Ed448' | 'X25519' | 'X448'>, string>
      >({
        Ed25519: 'ed25519',
        Ed448: 'ed448',
        X25519: 'x25519',
        X448: 'x448',
      });
    });
  });

  describe('load()', () => {
    it('should load the provided parameters into an octet key pair json web key.', async () => {
      await expect(backend.load(publicParameters)).resolves.toBeInstanceOf(OctetKeyPairKey);
    });
  });

  describe('generate()', () => {
    it('should throw when passing an unsupported elliptic curve.', async () => {
      // @ts-expect-error Unsupported Elliptic Curve.
      await expect(backend.generate({ curve: 'P-256' })).rejects.toThrow(
        new UnsupportedEllipticCurveException('Unsupported Elliptic Curve "P-256" for JSON Web Key Type "OKP".')
      );
    });

    it('should generate an ed25519 octet key pair json web key.', async () => {
      let key!: OctetKeyPairKey;

      expect((key = await backend.generate({ curve: 'Ed25519' }))).toBeInstanceOf(OctetKeyPairKey);
      expect(key.crv).toEqual<EllipticCurve>('Ed25519');
    });

    it('should generate an ed448 octet key pair json web key.', async () => {
      let key!: OctetKeyPairKey;

      expect((key = await backend.generate({ curve: 'Ed448' }))).toBeInstanceOf(OctetKeyPairKey);
      expect(key.crv).toEqual<EllipticCurve>('Ed448');
    });

    it('should generate an x25519 octet key pair json web key.', async () => {
      let key!: OctetKeyPairKey;

      expect((key = await backend.generate({ curve: 'X25519' }))).toBeInstanceOf(OctetKeyPairKey);
      expect(key.crv).toEqual<EllipticCurve>('X25519');
    });

    it('should generate an x488 octet key pair json web key.', async () => {
      let key!: OctetKeyPairKey;

      expect((key = await backend.generate({ curve: 'X448' }))).toBeInstanceOf(OctetKeyPairKey);
      expect(key.crv).toEqual<EllipticCurve>('X448');
    });
  });
});
