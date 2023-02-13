import { Buffer } from 'buffer';
import { randomBytes, randomInt } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { OctKeyParameters } from '../../jwk/backends/oct/octkey.parameters';
import { JsonWebKey } from '../../jwk/jsonwebkey';
import { HS256, HS384, HS512 } from './hmac.backend';

const generateOctKey = (size: number): JsonWebKey<OctKeyParameters> => {
  return new JsonWebKey<OctKeyParameters>({ kty: 'oct', k: randomBytes(size).toString('base64url') });
};

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature HMAC using SHA-256 Backend', () => {
  it('should reject a small secret.', async () => {
    const key = generateOctKey(randomInt(1, 32));

    await expect(HS256.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException(`The size of the OctKey Secret must be at least 32 bytes.`)
    );
  });

  it('should sign and verify a message.', async () => {
    const key = generateOctKey(32);
    const signature = await HS256.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(HS256.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature HMAC using SHA-384 Backend', () => {
  it('should reject a small secret.', async () => {
    const key = generateOctKey(randomInt(1, 48));
    await expect(HS384.sign(message, key)).rejects.toThrow(InvalidJsonWebKeyException);
  });

  it('should sign and verify a message.', async () => {
    const key = generateOctKey(48);
    const signature = await HS384.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(HS384.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature HMAC using SHA-512 Backend', () => {
  it('should reject a small secret.', async () => {
    const key = generateOctKey(randomInt(1, 64));
    await expect(HS512.sign(message, key)).rejects.toThrow(InvalidJsonWebKeyException);
  });

  it('should sign and verify a message.', async () => {
    const key = generateOctKey(64);
    const signature = await HS512.sign(message, key);

    expect(signature).toEqual(expect.any(Buffer));
    await expect(HS512.verify(signature, message, key)).resolves.not.toThrow();
  });
});
