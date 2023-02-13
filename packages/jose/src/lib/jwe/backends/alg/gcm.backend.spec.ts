import { Buffer } from 'buffer';

import { JsonWebKey } from '../../../jwk/jsonwebkey';
import { JsonWebKeyType } from '../../../jwk/jsonwebkey-type.enum';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { A128GCMKW, A192GCMKW, A256GCMKW } from './gcm.backend';

const contentEncryptionKey = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

const enc = <JsonWebEncryptionContentEncryptionBackend>{
  generateContentEncryptionKey: async (): Promise<Buffer> => contentEncryptionKey,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateContentEncryptionKey: (_: Buffer): void => undefined,
};

describe('JSON Web Encryption Key Wrap AES A128GCMKW Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const key = new JsonWebKey({ kty: JsonWebKeyType.Octet, k: 'EBESExQVFhcYGRobHB0eHw' });
    const [cek, ek, header] = await A128GCMKW.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(expect.any(Buffer));
    expect(ek).toHaveLength(16);

    await expect(A128GCMKW.unwrap(enc, key, ek, header)).resolves.toEqual(contentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap AES A192GCMKW Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const key = new JsonWebKey({ kty: JsonWebKeyType.Octet, k: 'EBESExQVFhcYGRobHB0eHyAhIiMkJSYn' });
    const [cek, ek, header] = await A192GCMKW.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(expect.any(Buffer));
    expect(ek).toHaveLength(16);

    await expect(A192GCMKW.unwrap(enc, key, ek, header)).resolves.toEqual(contentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap AES A256GCMKW Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const key = new JsonWebKey({ kty: JsonWebKeyType.Octet, k: 'EBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8' });
    const [cek, ek, header] = await A256GCMKW.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(expect.any(Buffer));
    expect(ek).toHaveLength(16);

    await expect(A256GCMKW.unwrap(enc, key, ek, header)).resolves.toEqual(contentEncryptionKey);
  });
});
