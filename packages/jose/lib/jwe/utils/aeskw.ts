import { createCipheriv, createDecipheriv } from 'crypto'

export function wrap(keySize: number, cek: Buffer, key: Buffer): Buffer {
  const algorithm = `aes${keySize}-wrap`
  const cipher = createCipheriv(algorithm, key, Buffer.alloc(8, 0xa6))

  return Buffer.concat([cipher.update(cek), cipher.final()])
}

export function unwrap(keySize: number, ek: Buffer, key: Buffer): Buffer {
  const algorithm = `aes${keySize}-wrap`
  const decipher = createDecipheriv(algorithm, key, Buffer.alloc(8, 0xa6))

  return Buffer.concat([decipher.update(ek), decipher.final()])
}
