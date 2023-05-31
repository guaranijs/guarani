import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { OctetSequenceKey } from '../../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { A128KW, A192KW, A256KW } from './aes.backend';

const expectedContentEncryptionKey = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
  cekSize: 128,
  generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
  validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
});

describe('JSON Web Encryption Key Wrap AES Key Wrap with default initial value using 128-bit key Backend', () => {
  it('should have "A128KW" as its "algorithm".', () => {
    expect(A128KW['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('A128KW');
  });

  it('should have 128 as its "keySize".', () => {
    expect(A128KW['keySize']).toEqual(128);
  });

  it('should have "aes128-wrap" as its "cipher".', () => {
    expect(A128KW['cipher']).toEqual('aes128-wrap');
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => A128KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "A128KW" only accepts "oct" JSON Web Keys.'
      )
    );
  });

  it('should throw when the unwrap key is not 128-bits long.', async () => {
    const key = await OctetSequenceKey.generate('oct', { length: 24 });

    expect(() => A128KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.')
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap a content encryption key.', async () => {
    const wrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODw' });

    let contentEncryptionKey!: Buffer;
    let wrappedKey!: Buffer;

    await expect(
      (async () => ([contentEncryptionKey, wrappedKey] = await A128KW.wrap(contentEncryptionBackend, wrapKey)))()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey.toString('base64url')).toEqual('k1o-sQHDSt0CXhcLRv8Nsj5cL66Mj4Nw');
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    const unwrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODw' });

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => {
        return (contentEncryptionKey = await A128KW.unwrap(
          contentEncryptionBackend,
          unwrapKey,
          Buffer.from('k1o-sQHDSt0CXhcLRv8Nsj5cL66Mj4Nw', 'base64url')
        ));
      })()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap AES Key Wrap with default initial value using 192-bit key Backend', () => {
  it('should have "A192KW" as its "algorithm".', () => {
    expect(A192KW['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('A192KW');
  });

  it('should have 192 as its "keySize".', () => {
    expect(A192KW['keySize']).toEqual(192);
  });

  it('should have "aes192-wrap" as its "cipher".', () => {
    expect(A192KW['cipher']).toEqual('aes192-wrap');
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => A192KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "A192KW" only accepts "oct" JSON Web Keys.'
      )
    );
  });

  it('should throw when the unwrap key is not 192-bits long.', async () => {
    const key = await OctetSequenceKey.generate('oct', { length: 32 });

    expect(() => A192KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.')
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap a content encryption key.', async () => {
    const wrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYX' });

    let contentEncryptionKey!: Buffer;
    let wrappedKey!: Buffer;

    await expect(
      (async () => ([contentEncryptionKey, wrappedKey] = await A192KW.wrap(contentEncryptionBackend, wrapKey)))()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey.toString('base64url')).toEqual('VJBm6T4_p5MNZCsW4lu050IbEWJpedBF');
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    const unwrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYX' });

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => {
        return (contentEncryptionKey = await A192KW.unwrap(
          contentEncryptionBackend,
          unwrapKey,
          Buffer.from('VJBm6T4_p5MNZCsW4lu050IbEWJpedBF', 'base64url')
        ));
      })()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap AES Key Wrap with default initial value using 256-bit key Backend', () => {
  it('should have "A256KW" as its "algorithm".', () => {
    expect(A256KW['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('A256KW');
  });

  it('should have 256 as its "keySize".', () => {
    expect(A256KW['keySize']).toEqual(256);
  });

  it('should have "aes256-wrap" as its "cipher".', () => {
    expect(A256KW['cipher']).toEqual('aes256-wrap');
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => A256KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "A256KW" only accepts "oct" JSON Web Keys.'
      )
    );
  });

  it('should throw when the unwrap key is not 256-bits long.', async () => {
    const key = await OctetSequenceKey.generate('oct', { length: 16 });

    expect(() => A256KW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.')
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap a content encryption key.', async () => {
    const wrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8' });

    let contentEncryptionKey!: Buffer;
    let wrappedKey!: Buffer;

    await expect(
      (async () => ([contentEncryptionKey, wrappedKey] = await A256KW.wrap(contentEncryptionBackend, wrapKey)))()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey.toString('base64url')).toEqual('jMS_7Kip8vOMiyg5Lx6PSz5aX9LyC9aI');
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    const unwrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8' });

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => {
        return (contentEncryptionKey = await A256KW.unwrap(
          contentEncryptionBackend,
          unwrapKey,
          Buffer.from('jMS_7Kip8vOMiyg5Lx6PSz5aX9LyC9aI', 'base64url')
        ));
      })()
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});
