import { Buffer } from 'buffer';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-jsonwebencryption.exception';
import { JsonWebEncryptionContentEncryptionBackend } from './jsonwebencryption-content-encryption.backend';

const invalidCeks: unknown[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol.for('foo'), () => 1, {}, []];

const algorithm: JsonWebEncryptionContentEncryptionBackend = Reflect.construct(
  JsonWebEncryptionContentEncryptionBackend,
  [null, 128, 96]
);

describe('JSON Web Encryption Content Encryption Algorithm', () => {
  it('should generate a 16 bytes content encryption key.', async () => {
    await expect(algorithm.generateContentEncryptionKey()).resolves.toHaveLength(16);
  });

  it('should generate a 12 bytes initialization vector.', async () => {
    await expect(algorithm.generateInitializationVector()).resolves.toHaveLength(12);
  });

  it.each(invalidCeks)('should throw when validating a content encryption key that is not a buffer.', (invalidCek) => {
    // @ts-expect-error Invalid Type
    expect(() => algorithm.validateContentEncryptionKey(invalidCek)).toThrow(new InvalidJsonWebEncryptionException());
  });

  it('should throw when the length of the content encryption key does not match the expected length.', () => {
    expect(() => algorithm.validateContentEncryptionKey(Buffer.alloc(24))).toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should not throw when the length of the content encryption key matches the expected length.', () => {
    expect(() => algorithm.validateContentEncryptionKey(Buffer.alloc(16))).not.toThrow();
  });

  it('should throw when the length of the initialization vector does not match the expected length.', () => {
    expect(() => algorithm.validateInitializationVector(Buffer.alloc(16))).toThrow(
      new InvalidJsonWebEncryptionException()
    );
  });

  it('should not throw when the length of the initialization vector matches the expected length.', () => {
    expect(() => algorithm.validateInitializationVector(Buffer.alloc(12))).not.toThrow();
  });
});
