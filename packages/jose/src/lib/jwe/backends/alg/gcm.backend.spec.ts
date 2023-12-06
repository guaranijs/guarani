import { Buffer } from 'buffer';
import { CipherGCMTypes } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { OctetSequenceKey } from '../../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { A128GCMKW, A192GCMKW, A256GCMKW, GcmBackend } from './gcm.backend';
import { GcmHeaderParameters } from './gcm.header.parameters';

const expectedContentEncryptionKey = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

const contentEncryptionBackend = jest.mocked<JsonWebEncryptionContentEncryptionBackend>(<any>{
  cekSize: 128,
  generateContentEncryptionKey: jest.fn().mockResolvedValue(expectedContentEncryptionKey),
  validateContentEncryptionKey: jest.fn().mockReturnValue(undefined),
});

describe('JSON Web Encryption Key Wrap AES GCM using 128-bit key Backend', () => {
  const generateInitializationVectorSpy = jest.spyOn<GcmBackend, any>(A128GCMKW, 'generateInitializationVector');

  beforeAll(() => {
    generateInitializationVectorSpy.mockResolvedValue(Buffer.alloc(16, 0x00));
  });

  afterAll(() => {
    generateInitializationVectorSpy.mockReset();
    generateInitializationVectorSpy.mockRestore();
  });

  it('should have "A128GCMKW" as its "algorithm".', () => {
    expect(A128GCMKW['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('A128GCMKW');
  });

  it('should have 96 as its "ivSize".', () => {
    expect(A128GCMKW['ivSize']).toEqual(96);
  });

  it('should have 16 as its "authTagLength".', () => {
    expect(A128GCMKW['authTagLength']).toEqual(16);
  });

  it('should have 128 as its "keySize".', () => {
    expect(A128GCMKW['keySize']).toEqual(128);
  });

  it('should have "aes-128-gcm" as its "cipher".', () => {
    expect(A128GCMKW['cipher']).toEqual<CipherGCMTypes>('aes-128-gcm');
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => A128GCMKW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "A128GCMKW" only accepts "oct" JSON Web Keys.',
      ),
    );
  });

  it('should throw when the unwrap key is not 128-bits long.', async () => {
    const key = await OctetSequenceKey.generate('oct', { length: 24 });

    expect(() => A128GCMKW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.'),
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap a content encryption key.', async () => {
    const wrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODw' });

    let contentEncryptionKey!: Buffer;
    let wrappedKey!: Buffer;
    let header!: Partial<GcmHeaderParameters>;

    await expect(
      (async () => {
        return ([contentEncryptionKey, wrappedKey, header] = await A128GCMKW.wrap(contentEncryptionBackend, wrapKey));
      })(),
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey.toString('base64url')).toEqual('ABd59e-78nDpOAW98DOtpA');

    expect(header).toStrictEqual<Partial<GcmHeaderParameters>>({
      iv: 'AAAAAAAAAAAAAAAAAAAAAA',
      tag: '-PH6hQTHu7DHeVI-2wXz4w',
    });
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    const unwrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODw' });

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => {
        return (contentEncryptionKey = await A128GCMKW.unwrap(
          contentEncryptionBackend,
          unwrapKey,
          Buffer.from('ABd59e-78nDpOAW98DOtpA', 'base64url'),
          <GcmHeaderParameters>{ iv: 'AAAAAAAAAAAAAAAAAAAAAA', tag: '-PH6hQTHu7DHeVI-2wXz4w' },
        ));
      })(),
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap AES GCM using 192-bit key Backend', () => {
  const generateInitializationVectorSpy = jest.spyOn<GcmBackend, any>(A192GCMKW, 'generateInitializationVector');

  beforeAll(() => {
    generateInitializationVectorSpy.mockResolvedValue(Buffer.alloc(16, 0x00));
  });

  afterAll(() => {
    generateInitializationVectorSpy.mockReset();
    generateInitializationVectorSpy.mockRestore();
  });

  it('should have "A192GCMKW" as its "algorithm".', () => {
    expect(A192GCMKW['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('A192GCMKW');
  });

  it('should have 96 as its "ivSize".', () => {
    expect(A192GCMKW['ivSize']).toEqual(96);
  });

  it('should have 16 as its "authTagLength".', () => {
    expect(A192GCMKW['authTagLength']).toEqual(16);
  });

  it('should have 192 as its "keySize".', () => {
    expect(A192GCMKW['keySize']).toEqual(192);
  });

  it('should have "aes-192-gcm" as its "cipher".', () => {
    expect(A192GCMKW['cipher']).toEqual<CipherGCMTypes>('aes-192-gcm');
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => A192GCMKW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "A192GCMKW" only accepts "oct" JSON Web Keys.',
      ),
    );
  });

  it('should throw when the unwrap key is not 192-bits long.', async () => {
    const key = await OctetSequenceKey.generate('oct', { length: 32 });

    expect(() => A192GCMKW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.'),
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap a content encryption key.', async () => {
    const wrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYX' });

    let contentEncryptionKey!: Buffer;
    let wrappedKey!: Buffer;
    let header!: Partial<GcmHeaderParameters>;

    await expect(
      (async () => {
        return ([contentEncryptionKey, wrappedKey, header] = await A192GCMKW.wrap(contentEncryptionBackend, wrapKey));
      })(),
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey.toString('base64url')).toEqual('qfl1lglQwz0qLnyo0bztqg');

    expect(header).toStrictEqual<Partial<GcmHeaderParameters>>({
      iv: 'AAAAAAAAAAAAAAAAAAAAAA',
      tag: 'pbyGZcfYFQ94E5JOhc1rNQ',
    });
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    const unwrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYX' });

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => {
        return (contentEncryptionKey = await A192GCMKW.unwrap(
          contentEncryptionBackend,
          unwrapKey,
          Buffer.from('qfl1lglQwz0qLnyo0bztqg', 'base64url'),
          <GcmHeaderParameters>{ iv: 'AAAAAAAAAAAAAAAAAAAAAA', tag: 'pbyGZcfYFQ94E5JOhc1rNQ' },
        ));
      })(),
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap AES GCM using 256-bit key Backend', () => {
  const generateInitializationVectorSpy = jest.spyOn<GcmBackend, any>(A256GCMKW, 'generateInitializationVector');

  beforeAll(() => {
    generateInitializationVectorSpy.mockResolvedValue(Buffer.alloc(16, 0x00));
  });

  afterAll(() => {
    generateInitializationVectorSpy.mockReset();
    generateInitializationVectorSpy.mockRestore();
  });

  it('should have "A256GCMKW" as its "algorithm".', () => {
    expect(A256GCMKW['algorithm']).toEqual<JsonWebEncryptionKeyWrapAlgorithm>('A256GCMKW');
  });

  it('should have 96 as its "ivSize".', () => {
    expect(A256GCMKW['ivSize']).toEqual(96);
  });

  it('should have 16 as its "authTagLength".', () => {
    expect(A256GCMKW['authTagLength']).toEqual(16);
  });

  it('should have 256 as its "keySize".', () => {
    expect(A256GCMKW['keySize']).toEqual(256);
  });

  it('should have "aes-256-gcm" as its "cipher".', () => {
    expect(A256GCMKW['cipher']).toEqual<CipherGCMTypes>('aes-256-gcm');
  });

  it('should throw when not using an "oct" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, OctetSequenceKey.prototype);

    expect(() => A256GCMKW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException(
        'The JSON Web Encryption Key Wrap Algorithm "A256GCMKW" only accepts "oct" JSON Web Keys.',
      ),
    );
  });

  it('should throw when the unwrap key is not 256-bits long.', async () => {
    const key = await OctetSequenceKey.generate('oct', { length: 16 });

    expect(() => A256GCMKW['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('Invalid JSON Web Key Secret Size.'),
    );
  });

  it.todo('should throw when the length of the unwrapped key does not match the "cekSize".');

  it('should wrap a content encryption key.', async () => {
    const wrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8' });

    let contentEncryptionKey!: Buffer;
    let wrappedKey!: Buffer;
    let header!: Partial<GcmHeaderParameters>;

    await expect(
      (async () => {
        return ([contentEncryptionKey, wrappedKey, header] = await A256GCMKW.wrap(contentEncryptionBackend, wrapKey));
      })(),
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
    expect(wrappedKey.toString('base64url')).toEqual('yL9aObHACNMSfHD7f8E2CA');

    expect(header).toStrictEqual<Partial<GcmHeaderParameters>>({
      iv: 'AAAAAAAAAAAAAAAAAAAAAA',
      tag: 'Gy5-RQYMQw1x8R5w4awdjw',
    });
  });

  it('should unwrap a wrapped content encryption key.', async () => {
    const unwrapKey = new OctetSequenceKey({ kty: 'oct', k: 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8' });

    let contentEncryptionKey!: Buffer;

    await expect(
      (async () => {
        return (contentEncryptionKey = await A256GCMKW.unwrap(
          contentEncryptionBackend,
          unwrapKey,
          Buffer.from('yL9aObHACNMSfHD7f8E2CA', 'base64url'),
          <GcmHeaderParameters>{ iv: 'AAAAAAAAAAAAAAAAAAAAAA', tag: 'Gy5-RQYMQw1x8R5w4awdjw' },
        ));
      })(),
    ).resolves.not.toThrow();

    expect(contentEncryptionKey).toEqual(expectedContentEncryptionKey);
  });
});
