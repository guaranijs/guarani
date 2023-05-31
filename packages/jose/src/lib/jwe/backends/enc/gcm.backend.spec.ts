import { Buffer } from 'buffer';
import { CipherGCMTypes } from 'crypto';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-jsonwebencryption.exception';
import { JsonWebEncryptionContentEncryptionAlgorithm } from '../../jsonwebencryption-content-encryption-algorithm.type';
import { A128GCM, A192GCM, A256GCM } from './gcm.backend';

const plaintext = Buffer.from('Super secret message.');
const aad = Buffer.alloc(0);

describe('JSON Web Encryption Content Encryption AES Galois Counter Mode using 128-bits key Backend', () => {
  const generateInitializationVectorSpy = jest.spyOn(A128GCM, 'generateInitializationVector');
  const generateContentEncryptionKeySpy = jest.spyOn(A128GCM, 'generateContentEncryptionKey');

  beforeAll(() => {
    generateInitializationVectorSpy.mockResolvedValue(Buffer.alloc(12, 0x00));
    generateContentEncryptionKeySpy.mockResolvedValue(Buffer.from([...Array(16).keys()]));
  });

  afterAll(() => {
    generateInitializationVectorSpy.mockReset();
    generateInitializationVectorSpy.mockRestore();

    generateContentEncryptionKeySpy.mockReset();
    generateContentEncryptionKeySpy.mockRestore();
  });

  it('should have "A128GCM" as its algorithm.', () => {
    expect(A128GCM['algorithm']).toEqual<JsonWebEncryptionContentEncryptionAlgorithm>('A128GCM');
  });

  it('should have 128 as its "cekSize" value.', () => {
    expect(A128GCM['cekSize']).toEqual(128);
  });

  it('should have 96 as its "ivSize" value.', () => {
    expect(A128GCM['ivSize']).toEqual(96);
  });

  it('should have 16 as its "authTagLength" value.', () => {
    expect(A128GCM['authTagLength']).toEqual(16);
  });

  it('should have "aes-128-gcm" as its "cipher" value.', () => {
    expect(A128GCM['cipher']).toEqual<CipherGCMTypes>('aes-128-gcm');
  });

  it('should throw when encrypting with an initialization vector with an incorrect length.', async () => {
    const key = await A128GCM.generateContentEncryptionKey();

    await expect(A128GCM.encrypt(plaintext, aad, Buffer.alloc(0), key)).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should throw when encrypting with a content encryption key with an incorrect length.', async () => {
    const iv = await A128GCM.generateInitializationVector();

    await expect(A128GCM.encrypt(plaintext, aad, iv, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should encrypt a message.', async () => {
    const iv = await A128GCM.generateInitializationVector();
    const key = await A128GCM.generateContentEncryptionKey();

    const [ciphertext, tag] = await A128GCM.encrypt(plaintext, aad, iv, key);

    expect(ciphertext.toString('base64url')).toEqual('GqP3Nuu71emA-x8cQOzV7srMTEsa');
    expect(tag.toString('base64url')).toEqual('jGoLwZ2vNa8oghBPpwv5fw');
  });

  it('should decrypt a message.', async () => {
    const iv = await A128GCM.generateInitializationVector();
    const key = await A128GCM.generateContentEncryptionKey();

    const ciphertext = Buffer.from('GqP3Nuu71emA-x8cQOzV7srMTEsa', 'base64url');
    const tag = Buffer.from('jGoLwZ2vNa8oghBPpwv5fw', 'base64url');

    await expect(A128GCM.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});

describe('JSON Web Encryption Content Encryption AES Galois Counter Mode using 192-bits key Backend', () => {
  const generateInitializationVectorSpy = jest.spyOn(A192GCM, 'generateInitializationVector');
  const generateContentEncryptionKeySpy = jest.spyOn(A192GCM, 'generateContentEncryptionKey');

  beforeAll(() => {
    generateInitializationVectorSpy.mockResolvedValue(Buffer.alloc(12, 0x00));
    generateContentEncryptionKeySpy.mockResolvedValue(Buffer.from([...Array(24).keys()]));
  });

  afterAll(() => {
    generateInitializationVectorSpy.mockReset();
    generateInitializationVectorSpy.mockRestore();

    generateContentEncryptionKeySpy.mockReset();
    generateContentEncryptionKeySpy.mockRestore();
  });

  it('should have "A192GCM" as its algorithm.', () => {
    expect(A192GCM['algorithm']).toEqual<JsonWebEncryptionContentEncryptionAlgorithm>('A192GCM');
  });

  it('should have 192 as its "cekSize" value.', () => {
    expect(A192GCM['cekSize']).toEqual(192);
  });

  it('should have 96 as its "ivSize" value.', () => {
    expect(A192GCM['ivSize']).toEqual(96);
  });

  it('should have 16 as its "authTagLength" value.', () => {
    expect(A192GCM['authTagLength']).toEqual(16);
  });

  it('should have "aes-192-gcm" as its "cipher" value.', () => {
    expect(A192GCM['cipher']).toEqual<CipherGCMTypes>('aes-192-gcm');
  });

  it('should throw when encrypting with an initialization vector with an incorrect length.', async () => {
    const key = await A192GCM.generateContentEncryptionKey();

    await expect(A192GCM.encrypt(plaintext, aad, Buffer.alloc(0), key)).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should throw when encrypting with a content encryption key with an incorrect length.', async () => {
    const iv = await A192GCM.generateInitializationVector();

    await expect(A192GCM.encrypt(plaintext, aad, iv, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should encrypt a message.', async () => {
    const iv = await A192GCM.generateInitializationVector();
    const key = await A192GCM.generateContentEncryptionKey();

    const [ciphertext, tag] = await A192GCM.encrypt(plaintext, aad, iv, key);

    expect(ciphertext.toString('base64url')).toEqual('iHZi7sVtV0ngMCdS16dAtegT-cBf');
    expect(tag.toString('base64url')).toEqual('aO3CNcjulrYcMKKdUiILOg');
  });

  it('should decrypt a message.', async () => {
    const iv = await A192GCM.generateInitializationVector();
    const key = await A192GCM.generateContentEncryptionKey();

    const ciphertext = Buffer.from('iHZi7sVtV0ngMCdS16dAtegT-cBf', 'base64url');
    const tag = Buffer.from('aO3CNcjulrYcMKKdUiILOg', 'base64url');

    await expect(A192GCM.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});

describe('JSON Web Encryption Content Encryption AES Galois Counter Mode using 256-bits key Backend', () => {
  const generateInitializationVectorSpy = jest.spyOn(A256GCM, 'generateInitializationVector');
  const generateContentEncryptionKeySpy = jest.spyOn(A256GCM, 'generateContentEncryptionKey');

  beforeAll(() => {
    generateInitializationVectorSpy.mockResolvedValue(Buffer.alloc(12, 0x00));
    generateContentEncryptionKeySpy.mockResolvedValue(Buffer.from([...Array(32).keys()]));
  });

  afterAll(() => {
    generateInitializationVectorSpy.mockReset();
    generateInitializationVectorSpy.mockRestore();

    generateContentEncryptionKeySpy.mockReset();
    generateContentEncryptionKeySpy.mockRestore();
  });

  it('should have "A256GCM" as its algorithm.', () => {
    expect(A256GCM['algorithm']).toEqual<JsonWebEncryptionContentEncryptionAlgorithm>('A256GCM');
  });

  it('should have 256 as its "cekSize" value.', () => {
    expect(A256GCM['cekSize']).toEqual(256);
  });

  it('should have 96 as its "ivSize" value.', () => {
    expect(A256GCM['ivSize']).toEqual(96);
  });

  it('should have 16 as its "authTagLength" value.', () => {
    expect(A256GCM['authTagLength']).toEqual(16);
  });

  it('should have "aes-256-gcm" as its "cipher" value.', () => {
    expect(A256GCM['cipher']).toEqual<CipherGCMTypes>('aes-256-gcm');
  });

  it('should throw when encrypting with an initialization vector with an incorrect length.', async () => {
    const key = await A256GCM.generateContentEncryptionKey();

    await expect(A256GCM.encrypt(plaintext, aad, Buffer.alloc(0), key)).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should throw when encrypting with a content encryption key with an incorrect length.', async () => {
    const iv = await A256GCM.generateInitializationVector();

    await expect(A256GCM.encrypt(plaintext, aad, iv, Buffer.alloc(0))).rejects.toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should encrypt a message.', async () => {
    const iv = await A256GCM.generateInitializationVector();
    const key = await A256GCM.generateContentEncryptionKey();

    const [ciphertext, tag] = await A256GCM.encrypt(plaintext, aad, iv, key);

    expect(ciphertext.toString('base64url')).toEqual('XcnFu8cM8Nhr2sxBOEH06qEiMTYG');
    expect(tag.toString('base64url')).toEqual('9ERsUHmKoxqutUPNmzOo3w');
  });

  it('should decrypt a message.', async () => {
    const iv = await A256GCM.generateInitializationVector();
    const key = await A256GCM.generateContentEncryptionKey();

    const ciphertext = Buffer.from('XcnFu8cM8Nhr2sxBOEH06qEiMTYG', 'base64url');
    const tag = Buffer.from('9ERsUHmKoxqutUPNmzOo3w', 'base64url');

    await expect(A256GCM.decrypt(ciphertext, aad, iv, tag, key)).resolves.toEqual(plaintext);
  });
});
