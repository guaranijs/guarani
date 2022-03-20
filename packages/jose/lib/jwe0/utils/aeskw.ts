import { createCipheriv, createDecipheriv, KeyObject } from 'crypto';

import { OctKey } from '../../jwk/algorithms/oct/oct.key';

/**
 * Wraps the provided CEK with the provided JSON Web Key.

 * @param cek Content Encryption Key.
 * @param key Wrapping Key.
 * @returns Wrapped Content Encryption Key.
 */
export function wrap(cek: Buffer, key: OctKey): Buffer {
  const cryptoKey: KeyObject = Reflect.get(key, 'cryptoKey');
  const keySize = cryptoKey.symmetricKeySize! * 8;

  const algorithm = `aes${keySize}-wrap`;
  const cipher = createCipheriv(algorithm, cryptoKey, Buffer.alloc(8, 0xa6));

  return Buffer.concat([cipher.update(cek), cipher.final()]);
}

/**
 * Unwraps the provided EK with the provided JSON Web key.
 *
 * @param ek Encrypted Key.
 * @param key Wrapping Key.
 * @returns Unwrapped Content Encryption Key.
 */
export function unwrap(ek: Buffer, key: OctKey): Buffer {
  const cryptoKey: KeyObject = Reflect.get(key, 'cryptoKey');
  const keySize = cryptoKey.symmetricKeySize! * 8;

  const algorithm = `aes${keySize}-wrap`;
  const decipher = createDecipheriv(algorithm, cryptoKey, Buffer.alloc(8, 0xa6));

  return Buffer.concat([decipher.update(ek), decipher.final()]);
}
