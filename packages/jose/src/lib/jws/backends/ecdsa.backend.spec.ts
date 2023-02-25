import { Buffer } from 'buffer';
import { generateKeyPairSync } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { EllipticCurve } from '../../jwk/backends/elliptic-curve.type';
import { EllipticCurveKey } from '../../jwk/backends/elliptic-curve/elliptic-curve.key';
import { EllipticCurveKeyParameters } from '../../jwk/backends/elliptic-curve/elliptic-curve.key.parameters';
import { ES256, ES384, ES512 } from './ecdsa.backend';

const generateEcKey = (curve: Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521'>): EllipticCurveKey => {
  const curves: Record<Extract<EllipticCurve, 'P-256' | 'P-384' | 'P-521'>, string> = {
    'P-256': 'prime256v1',
    'P-384': 'secp384r1',
    'P-521': 'secp521r1',
  };

  const { privateKey } = generateKeyPairSync('ec', { namedCurve: curves[curve] });

  return new EllipticCurveKey(<EllipticCurveKeyParameters>privateKey.export({ format: 'jwk' }));
};

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature ECDSA using P-256 and SHA-256 Backend', () => {
  it('should reject a different curve.', async () => {
    const key = generateEcKey('P-384');

    await expect(ES256.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Signature ECDSA Backend "ES256" only accepts the Elliptic Curve "P-256".'
      )
    );
  });

  it('should sign and verify a message.', async () => {
    const key = generateEcKey('P-256');
    const signature = await ES256.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(ES256.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature ECDSA using P-384 and SHA-384 Backend', () => {
  it('should reject a different curve.', async () => {
    const key = generateEcKey('P-521');

    await expect(ES384.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Signature ECDSA Backend "ES384" only accepts the Elliptic Curve "P-384".'
      )
    );
  });

  it('should sign and verify a message.', async () => {
    const key = generateEcKey('P-384');
    const signature = await ES384.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(ES384.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature ECDSA using P-521 and SHA-512 Backend', () => {
  it('should reject a different curve.', async () => {
    const key = generateEcKey('P-256');

    await expect(ES512.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Signature ECDSA Backend "ES512" only accepts the Elliptic Curve "P-521".'
      )
    );
  });

  it('should sign and verify a message.', async () => {
    const key = generateEcKey('P-521');
    const signature = await ES512.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(ES512.verify(signature, message, key)).resolves.not.toThrow();
  });
});
