import { Buffer } from 'buffer';

import { A128GCM, A192GCM, A256GCM } from './gcm.backend';

const plaintext = Buffer.from('Super secret message.');
const aad = Buffer.alloc(0);

describe('JSON Web Encryption Content Encryption AES Galois Counter Mode using 128-bits key Backend', () => {
  it('should encrypt and decrypt a message.', async () => {
    const iv = await A128GCM.generateInitializationVector();
    const key = await A128GCM.generateContentEncryptionKey();
    const [ciphertext, tag] = await A128GCM.encrypt(plaintext, aad, iv, key);

    expect(ciphertext).toEqual(expect.any(Buffer));
    expect(tag).toEqual(expect.any(Buffer));

    await expect(A128GCM.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});

describe('JSON Web Encryption Content Encryption AES Galois Counter Mode using 192-bits key Backend', () => {
  it('should encrypt and decrypt a message.', async () => {
    const iv = await A192GCM.generateInitializationVector();
    const key = await A192GCM.generateContentEncryptionKey();
    const [ciphertext, tag] = await A192GCM.encrypt(plaintext, aad, iv, key);

    expect(ciphertext).toEqual(expect.any(Buffer));
    expect(tag).toEqual(expect.any(Buffer));

    await expect(A192GCM.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});

describe('JSON Web Encryption Content Encryption AES Galois Counter Mode using 256-bits key Backend', () => {
  it('should encrypt and decrypt a message.', async () => {
    const iv = await A256GCM.generateInitializationVector();
    const key = await A256GCM.generateContentEncryptionKey();
    const [ciphertext, tag] = await A256GCM.encrypt(plaintext, aad, iv, key);

    expect(ciphertext).toEqual(expect.any(Buffer));
    expect(tag).toEqual(expect.any(Buffer));

    await expect(A256GCM.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});
