import { Buffer } from 'buffer';
import { generateKeyPairSync } from 'crypto';

import { EllipticCurve } from '../../jwk/backends/elliptic-curve.type';
import { OctetKeyPairKey } from '../../jwk/backends/octet-key-pair/octet-key-pair.key';
import { OctetKeyPairKeyParameters } from '../../jwk/backends/octet-key-pair/octet-key-pair.key.parameters';
import { EdDSA } from './eddsa.backend';

const generateEcKey = (curve: Extract<EllipticCurve, 'Ed25519' | 'Ed448'>): OctetKeyPairKey => {
  const curves: Record<Extract<EllipticCurve, 'Ed25519' | 'Ed448'>, string> = {
    Ed25519: 'ed25519',
    Ed448: 'ed448',
  };

  const { privateKey } = generateKeyPairSync(<any>curves[curve]);

  return new OctetKeyPairKey(<OctetKeyPairKeyParameters>privateKey.export({ format: 'jwk' }));
};

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature EdDSA using Ed25519 Backend', () => {
  it('should sign and verify a message.', async () => {
    const key = generateEcKey('Ed25519');
    const signature = await EdDSA.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(EdDSA.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature EdDSA using Ed448 Backend', () => {
  it('should sign and verify a message.', async () => {
    const key = generateEcKey('Ed448');
    const signature = await EdDSA.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(EdDSA.verify(signature, message, key)).resolves.not.toThrow();
  });
});
