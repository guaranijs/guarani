import { Buffer } from 'buffer';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-jsonwebencryption.exception';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../../jsonwebencryption-content-encryption-algorithm.type';
import { A128CBC_HS256, A192CBC_HS384, A256CBC_HS512 } from './cbc.backend';

const plaintext = Buffer.from('Super secret message.');
const aad = Buffer.alloc(0);

describe('JSON Web Encryption Content Encryption AES Block Cipher Mode 128-bits using HMAC with SHA-256 Backend', () => {
  it('should have "A128CBC-HS256" as its algorithm.', () => {
    expect(A128CBC_HS256['algorithm']).toBe<JsonWebEncryptionContentEncryptionAlgorithm>('A128CBC-HS256');
  });

  it('should have 256 as its "cekSize" value.', () => {
    expect(A128CBC_HS256['cekSize']).toBe(256);
  });

  it('should have 128 as its "ivSize" value.', () => {
    expect(A128CBC_HS256['ivSize']).toBe(128);
  });

  it('should have 128 as its "keySize" value.', () => {
    expect(A128CBC_HS256['keySize']).toBe(128);
  });

  it('should have "SHA256" as its "hash" value.', () => {
    expect(A128CBC_HS256['hash']).toEqual('SHA256');
  });

  it('should have "aes-128-gcm" as its "cipher" value.', () => {
    expect(A128CBC_HS256['cipher']).toEqual('aes-128-cbc');
  });

  it('should throw when encrypting with an initialization vector with an incorrect length.', async () => {
    const key = await A128CBC_HS256.generateContentEncryptionKey();

    await expect(A128CBC_HS256.encrypt(plaintext, aad, Buffer.alloc(0), key)).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should throw when encrypting with a content encryption key with an incorrect length.', async () => {
    const iv = await A128CBC_HS256.generateInitializationVector();

    await expect(A128CBC_HS256.encrypt(plaintext, aad, iv, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should encrypt and decrypt a message.', async () => {
    const iv = await A128CBC_HS256.generateInitializationVector();
    const key = await A128CBC_HS256.generateContentEncryptionKey();

    const [ciphertext, tag] = await A128CBC_HS256.encrypt(plaintext, aad, iv, key);

    expect(ciphertext).toEqual(expect.any(Buffer));
    expect(tag).toEqual(expect.any(Buffer));

    await expect(A128CBC_HS256.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});

describe('JSON Web Encryption Content Encryption AES Block Cipher Mode 192-bits using HMAC with SHA-384 Backend', () => {
  it('should have "A192CBC-HS384" as its algorithm.', () => {
    expect(A192CBC_HS384['algorithm']).toBe<JsonWebEncryptionContentEncryptionAlgorithm>('A192CBC-HS384');
  });

  it('should have 384 as its "cekSize" value.', () => {
    expect(A192CBC_HS384['cekSize']).toBe(384);
  });

  it('should have 128 as its "ivSize" value.', () => {
    expect(A192CBC_HS384['ivSize']).toBe(128);
  });

  it('should have 192 as its "keySize" value.', () => {
    expect(A192CBC_HS384['keySize']).toBe(192);
  });

  it('should have "SHA384" as its "hash" value.', () => {
    expect(A192CBC_HS384['hash']).toEqual('SHA384');
  });

  it('should have "aes-192-gcm" as its "cipher" value.', () => {
    expect(A192CBC_HS384['cipher']).toEqual('aes-192-cbc');
  });

  it('should throw when encrypting with an initialization vector with an incorrect length.', async () => {
    const key = await A192CBC_HS384.generateContentEncryptionKey();

    await expect(A192CBC_HS384.encrypt(plaintext, aad, Buffer.alloc(0), key)).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should throw when encrypting with a content encryption key with an incorrect length.', async () => {
    const iv = await A192CBC_HS384.generateInitializationVector();

    await expect(A192CBC_HS384.encrypt(plaintext, aad, iv, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should encrypt and decrypt a message.', async () => {
    const iv = await A192CBC_HS384.generateInitializationVector();
    const key = await A192CBC_HS384.generateContentEncryptionKey();

    const [ciphertext, tag] = await A192CBC_HS384.encrypt(plaintext, aad, iv, key);

    expect(ciphertext).toEqual(expect.any(Buffer));
    expect(tag).toEqual(expect.any(Buffer));

    await expect(A192CBC_HS384.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});

describe('JSON Web Encryption Content Encryption AES Block Cipher Mode 256-bits using HMAC with SHA-512 Backend', () => {
  it('should have "A256CBC-HS512" as its algorithm.', () => {
    expect(A256CBC_HS512['algorithm']).toBe<JsonWebEncryptionContentEncryptionAlgorithm>('A256CBC-HS512');
  });

  it('should have 512 as its "cekSize" value.', () => {
    expect(A256CBC_HS512['cekSize']).toBe(512);
  });

  it('should have 128 as its "ivSize" value.', () => {
    expect(A256CBC_HS512['ivSize']).toBe(128);
  });

  it('should have 256 as its "keySize" value.', () => {
    expect(A256CBC_HS512['keySize']).toBe(256);
  });

  it('should have "SHA512" as its "hash" value.', () => {
    expect(A256CBC_HS512['hash']).toEqual('SHA512');
  });

  it('should have "aes-256-gcm" as its "cipher" value.', () => {
    expect(A256CBC_HS512['cipher']).toEqual('aes-256-cbc');
  });

  it('should throw when encrypting with an initialization vector with an incorrect length.', async () => {
    const key = await A256CBC_HS512.generateContentEncryptionKey();

    await expect(A256CBC_HS512.encrypt(plaintext, aad, Buffer.alloc(0), key)).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should throw when encrypting with a content encryption key with an incorrect length.', async () => {
    const iv = await A256CBC_HS512.generateInitializationVector();

    await expect(A256CBC_HS512.encrypt(plaintext, aad, iv, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should encrypt and decrypt a message.', async () => {
    const iv = await A256CBC_HS512.generateInitializationVector();
    const key = await A256CBC_HS512.generateContentEncryptionKey();

    const [ciphertext, tag] = await A256CBC_HS512.encrypt(plaintext, aad, iv, key);

    expect(ciphertext).toEqual(expect.any(Buffer));
    expect(tag).toEqual(expect.any(Buffer));

    await expect(A256CBC_HS512.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});
