import { Buffer } from 'buffer';
import { generateKeyPairSync } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { EcKeyParameters } from '../../jwk/backends/ec/eckey.parameters';
import { EllipticCurve } from '../../jwk/backends/ec/elliptic-curve.enum';
import { JsonWebKey } from '../../jwk/jsonwebkey';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.enum';
import { ES256, ES384, ES512 } from './ecdsa.backend';

const generateEcKey = (curve: EllipticCurve): JsonWebKey<EcKeyParameters> => {
  const curves: Record<EllipticCurve, string> = {
    [EllipticCurve.P256]: 'prime256v1',
    [EllipticCurve.P384]: 'secp384r1',
    [EllipticCurve.P521]: 'secp521r1',
  };

  const { privateKey } = generateKeyPairSync('ec', { namedCurve: curves[curve] });

  return new JsonWebKey(<EcKeyParameters>privateKey.export({ format: 'jwk' }));
};

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature Algorithm ECDSA using P-256 and SHA-256', () => {
  it('should reject a different curve.', async () => {
    const key = generateEcKey(EllipticCurve.P384);

    await expect(ES256.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException(
        `The JSON Web Signature ECDSA Algorithm "${JsonWebSignatureAlgorithm.ES256}" ` +
          `only accepts the Elliptic Curve "${EllipticCurve.P256}".`
      )
    );
  });

  it('should sign and verify a message.', async () => {
    const key = generateEcKey(EllipticCurve.P256);
    const signature = await ES256.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(ES256.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature Algorithm ECDSA using P-384 and SHA-384', () => {
  it('should reject a different curve.', async () => {
    const key = generateEcKey(EllipticCurve.P521);

    await expect(ES384.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException(
        `The JSON Web Signature ECDSA Algorithm "${JsonWebSignatureAlgorithm.ES384}" ` +
          `only accepts the Elliptic Curve "${EllipticCurve.P384}".`
      )
    );
  });

  it('should sign and verify a message.', async () => {
    const key = generateEcKey(EllipticCurve.P384);
    const signature = await ES384.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(ES384.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature Algorithm ECDSA using P-521 and SHA-512', () => {
  it('should reject a different curve.', async () => {
    const key = generateEcKey(EllipticCurve.P256);

    await expect(ES512.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException(
        `The JSON Web Signature ECDSA Algorithm "${JsonWebSignatureAlgorithm.ES512}" ` +
          `only accepts the Elliptic Curve "${EllipticCurve.P521}".`
      )
    );
  });

  it('should sign and verify a message.', async () => {
    const key = generateEcKey(EllipticCurve.P521);
    const signature = await ES512.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(ES512.verify(signature, message, key)).resolves.not.toThrow();
  });
});
