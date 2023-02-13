import { Buffer } from 'buffer';

import { JsonWebKey } from '../../../jwk/jsonwebkey';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { A128KW, A192KW, A256KW } from './aes.backend';

const contentEncryptionKey = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

const enc = <JsonWebEncryptionContentEncryptionBackend>{
  generateContentEncryptionKey: async (): Promise<Buffer> => contentEncryptionKey,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateContentEncryptionKey: (_: Buffer): void => undefined,
};

describe('JSON Web Encryption Key Wrap AES Key Wrap with default initial value using 128-bit key Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const key = new JsonWebKey({ kty: 'oct', k: 'EBESExQVFhcYGRobHB0eHw' });
    const [cek, ek] = await A128KW.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(Buffer.from('Ogu9AxwToenv9SHshBF8S5PKe5Pwh_YY', 'base64url'));

    await expect(A128KW.unwrap(enc, key, ek)).resolves.toEqual(contentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap AES Key Wrap with default initial value using 192-bit key Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const key = new JsonWebKey({ kty: 'oct', k: 'EBESExQVFhcYGRobHB0eHyAhIiMkJSYn' });
    const [cek, ek] = await A192KW.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(Buffer.from('O4K9z37P0CEqdvayE-SC1M74dJGn54St', 'base64url'));

    await expect(A192KW.unwrap(enc, key, ek)).resolves.toEqual(contentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap AES Key Wrap with default initial value using 256-bit key Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const key = new JsonWebKey({ kty: 'oct', k: 'EBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8' });
    const [cek, ek] = await A256KW.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(Buffer.from('VP21n-zeSbHkgD35YR-WLiC-k1MdpmbH', 'base64url'));

    await expect(A256KW.unwrap(enc, key, ek)).resolves.toEqual(contentEncryptionKey);
  });
});
