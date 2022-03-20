import { RsaKey } from '../../../lib/jwk';
import { PS256, PS384, PS512, RS256, RS384, RS512 } from '../../../lib/jws/algorithms/rsassa';
import { loadAsymmetricKey } from '../../utils';

const key = new RsaKey(loadAsymmetricKey('rsa', 'json', 'private'));

describe('JWS RSASSA-PSS Algorithm PS256', () => {
  const message = Buffer.from('Super secret message.');

  it('should sign and verify a message.', async () => {
    const signature = await PS256.sign(message, key);

    expect(signature).toEqual(expect.any(String));

    await expect(PS256.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JWS RSASSA-PSS Algorithm PS384', () => {
  const message = Buffer.from('Super secret message.');

  it('should sign and verify a message.', async () => {
    const signature = await PS384.sign(message, key);

    expect(signature).toEqual(expect.any(String));

    await expect(PS384.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JWS RSASSA-PSS Algorithm PS512', () => {
  const message = Buffer.from('Super secret message.');

  it('should sign and verify a message.', async () => {
    const signature = await PS512.sign(message, key);

    expect(signature).toEqual(expect.any(String));

    await expect(PS512.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JWS RSASSA-PKCS1-v1_5 Algorithm RS256', () => {
  const message = Buffer.from('Super secret message.');

  it('should sign and verify a message.', async () => {
    const signature = await RS256.sign(message, key);

    expect(signature).toEqual(expect.any(String));

    await expect(RS256.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JWS RSASSA-PKCS1-v1_5 Algorithm RS384', () => {
  const message = Buffer.from('Super secret message.');

  it('should sign and verify a message.', async () => {
    const signature = await RS384.sign(message, key);

    expect(signature).toEqual(expect.any(String));

    await expect(RS384.verify(signature, message, key)).resolves.not.toThrow();
  });
});

describe('JWS RSASSA-PKCS1-v1_5 Algorithm RS512', () => {
  const message = Buffer.from('Super secret message.');

  it('should sign and verify a message.', async () => {
    const signature = await RS512.sign(message, key);

    expect(signature).toEqual(expect.any(String));

    await expect(RS512.verify(signature, message, key)).resolves.not.toThrow();
  });
});
