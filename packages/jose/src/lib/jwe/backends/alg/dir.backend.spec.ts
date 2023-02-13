import { Buffer } from 'buffer';

import { JsonWebKey } from '../../../jwk/jsonwebkey';
import { JsonWebKeyType } from '../../../jwk/jsonwebkey-type.enum';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { dir } from './dir.backend';

describe('JSON Web Encryption Direct Key Wrap Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const enc = <JsonWebEncryptionContentEncryptionBackend>{
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      validateContentEncryptionKey: (_: Buffer) => undefined,
    };

    const key = new JsonWebKey({ kty: JsonWebKeyType.Octet, k: 'EBESExQVFhcYGRobHB0eHw' });
    const [cek, ek] = await dir.wrap(enc, key);

    expect(cek).toEqual(Buffer.from(<string>key.k, 'base64url'));
    expect(ek).toEqual(Buffer.alloc(0));

    await expect(dir.unwrap(enc, key, ek)).resolves.toEqual(Buffer.from(<string>key.k, 'base64url'));
  });
});
