import { Buffer } from 'buffer';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-jsonwebencryption.exception';
import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { OctetSequenceKey } from '../../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { dir } from './dir.backend';

const expectedContentEncryptionKey = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
  cekSize: 128,
  validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
});

describe('JSON Web Encryption Direct Key Wrap Backend', () => {
  it('should have "dir" as its "algorithm".', () => {
    expect(dir['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('dir');
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => dir['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "dir" only accepts "oct" JSON Web Keys.',
      ),
    );
  });

  it('should throw when providing the length of the wrapped key is not zero.', async () => {
    const unwrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODw' });

    await expect(dir.unwrap(contentEncryptionBackend, unwrapKey, Buffer.alloc(16))).rejects.toThrow(
      new InvalidJsonWebEncryptionException('Expected the Encrypted Content Encryption Key to be empty.'),
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap a content encryption key.', async () => {
    const wrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODw' });

    let contentEncryptionKey!: Buffer;
    let wrappedKey!: Buffer;

    await expect(
      (async () => ([contentEncryptionKey, wrappedKey] = await dir.wrap(contentEncryptionBackend, wrapKey)))(),
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey).toEqual(Buffer.alloc(0));
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    const unwrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODw' });

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => (contentEncryptionKey = await dir.unwrap(contentEncryptionBackend, unwrapKey, Buffer.alloc(0))))(),
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});
