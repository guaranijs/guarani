import { InvalidJsonWebKeyException } from '../../../lib/exceptions/invalid-json-web-key.exception';
import { OctKey } from '../../../lib/jwk/algorithms/oct/oct.key';
import { HS256, HS384, HS512 } from '../../../lib/jws/algorithms/hmac';

describe('JWS HMAC Algorithm HS256', () => {
  const message = Buffer.from('Super secret message.');

  it('should reject a secret too small.', async () => {
    await expect(async () => await HS256.sign(message, await OctKey.generate({ size: 31 }))).rejects.toThrow(
      InvalidJsonWebKeyException
    );
  });

  it('should sign and verify a message.', async () => {
    const key = await OctKey.generate({ size: 32 });
    const signature = await HS256.sign(message, key);

    expect(signature).toEqual(expect.any(String));

    await expect(HS256.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JWS HMAC Algorithm HS384', () => {
  const message = Buffer.from('Super secret message.');

  it('should reject a secret too small.', async () => {
    await expect(async () => await HS384.sign(message, await OctKey.generate({ size: 47 }))).rejects.toThrow(
      InvalidJsonWebKeyException
    );
  });

  it('should sign and verify a message.', async () => {
    const key = await OctKey.generate({ size: 48 });
    const signature = await HS384.sign(message, key);

    expect(signature).toEqual(expect.any(String));

    await expect(HS384.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JWS HMAC Algorithm HS512', () => {
  const message = Buffer.from('Super secret message.');

  it('should reject a secret too small.', async () => {
    await expect(async () => await HS512.sign(message, await OctKey.generate({ size: 63 }))).rejects.toThrow(
      InvalidJsonWebKeyException
    );
  });

  it('should sign and verify a message.', async () => {
    const key = await OctKey.generate({ size: 64 });
    const signature = await HS512.sign(message, key);

    expect(signature).toEqual(expect.any(String));

    await expect(HS512.verify(signature, message, key)).resolves.not.toThrow();
  });
});
