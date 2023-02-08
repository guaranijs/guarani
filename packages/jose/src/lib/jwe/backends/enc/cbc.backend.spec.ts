import { Buffer } from 'buffer';

import { A128CBC_HS256, A192CBC_HS384, A256CBC_HS512 } from './cbc.backend';

const plaintext = Buffer.from('Super secret message.');
const aad = Buffer.alloc(0);

describe('JSON Web Encryption Content Encryption AES Block Cipher Mode 128-bits using HMAC with SHA-256 Backend', () => {
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
  it('should encrypt and decrypt a message.', async () => {
    const iv = await A256CBC_HS512.generateInitializationVector();
    const key = await A256CBC_HS512.generateContentEncryptionKey();
    const [ciphertext, tag] = await A256CBC_HS512.encrypt(plaintext, aad, iv, key);

    expect(ciphertext).toEqual(expect.any(Buffer));
    expect(tag).toEqual(expect.any(Buffer));

    await expect(A256CBC_HS512.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});
