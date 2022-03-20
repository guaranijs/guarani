import { decode } from '@guarani/base64url';

import { JWE_ALGORITHMS } from '../../../../lib/jwe/algorithms/alg';
import { RsaKey } from '../../../../lib/jwk';

let key: RsaKey;
const cek = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

beforeAll(async () => (key = await RsaKey.generate(2048)));

describe('JWE RSA1_5 Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS.RSA1_5;
    const { ek, header } = await alg.wrap(cek, key);

    expect(ek).toEqual(expect.any(String));

    await expect(alg.unwrap(decode(ek, Buffer), key, header)).resolves.toEqual(cek);
  });
});

describe('JWE RSA-OAEP Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS['RSA-OAEP'];
    const { ek, header } = await alg.wrap(cek, key);

    expect(ek).toEqual(expect.any(String));

    await expect(alg.unwrap(decode(ek, Buffer), key, header)).resolves.toEqual(cek);
  });
});

describe('JWE RSA-OAEP-256 Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS['RSA-OAEP-256'];
    const { ek, header } = await alg.wrap(cek, key);

    expect(ek).toEqual(expect.any(String));

    await expect(alg.unwrap(decode(ek, Buffer), key, header)).resolves.toEqual(cek);
  });
});

describe('JWE RSA-OAEP-384 Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS['RSA-OAEP-384'];
    const { ek, header } = await alg.wrap(cek, key);

    expect(ek).toEqual(expect.any(String));

    await expect(alg.unwrap(decode(ek, Buffer), key, header)).resolves.toEqual(cek);
  });
});

describe('JWE RSA-OAEP-512 Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS['RSA-OAEP-512'];
    const { ek, header } = await alg.wrap(cek, key);

    expect(ek).toEqual(expect.any(String));

    await expect(alg.unwrap(decode(ek, Buffer), key, header)).resolves.toEqual(cek);
  });
});
