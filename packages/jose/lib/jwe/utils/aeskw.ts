import { createCipheriv, createDecipheriv } from 'crypto'

/**
 * Wraps the provided CEK with the provided JSON Web Key.

 * @param keySize - Size of the JSON Web Key in bits.
 * @param cek - Content Encryption Key.
 * @param key - Wrapping Key.
 * @returns Wrapped Content Encryption Key.
 */
export function wrap(keySize: number, cek: Buffer, key: Buffer): Buffer {
  const algorithm = `aes${keySize}-wrap`
  const cipher = createCipheriv(algorithm, key, Buffer.alloc(8, 0xa6))

  return Buffer.concat([cipher.update(cek), cipher.final()])
}

/**
 * Unwraps the provided EK with the provided JSON Web key.
 *
 * @param keySize - Size of the JSON Web Key in bits.
 * @param ek - Encrypted Key.
 * @param key - Wrapping Key.
 * @returns Unwrapped Content Encryption Key.
 */
export function unwrap(keySize: number, ek: Buffer, key: Buffer): Buffer {
  const algorithm = `aes${keySize}-wrap`
  const decipher = createDecipheriv(algorithm, key, Buffer.alloc(8, 0xa6))

  return Buffer.concat([decipher.update(ek), decipher.final()])
}
