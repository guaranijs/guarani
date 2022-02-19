import { decode } from '@guarani/base64url'

import { JWE_ENCRYPTIONS } from '../../../../lib/jwe/algorithms/enc'

const plaintext = Buffer.from('Super secret message.')
const aad = Buffer.alloc(0)

describe('JWE A128CBC-HS256 Content Encryption Algorithm', () => {
  it('should encrypt and decrypt a message.', async () => {
    const alg = JWE_ENCRYPTIONS['A128CBC-HS256']
    const iv = await alg.generateIV()
    const key = await alg.generateCEK()
    const { ciphertext, tag } = await alg.encrypt(plaintext, aad, iv, key)

    expect(ciphertext).toEqual(expect.any(String))
    expect(tag).toEqual(expect.any(String))

    await expect(
      alg.decrypt(decode(ciphertext, Buffer), aad, iv, decode(tag, Buffer), key)
    ).resolves.toEqual(plaintext)
  })
})

describe('JWE A192CBC-HS384 Content Encryption Algorithm', () => {
  it('should encrypt and decrypt a message.', async () => {
    const alg = JWE_ENCRYPTIONS['A192CBC-HS384']
    const iv = await alg.generateIV()
    const key = await alg.generateCEK()
    const { ciphertext, tag } = await alg.encrypt(plaintext, aad, iv, key)

    expect(ciphertext).toEqual(expect.any(String))
    expect(tag).toEqual(expect.any(String))

    await expect(
      alg.decrypt(decode(ciphertext, Buffer), aad, iv, decode(tag, Buffer), key)
    ).resolves.toEqual(plaintext)
  })
})

describe('JWE A256CBC-HS512 Content Encryption Algorithm', () => {
  it('should encrypt and decrypt a message.', async () => {
    const alg = JWE_ENCRYPTIONS['A256CBC-HS512']
    const iv = await alg.generateIV()
    const key = await alg.generateCEK()
    const { ciphertext, tag } = await alg.encrypt(plaintext, aad, iv, key)

    expect(ciphertext).toEqual(expect.any(String))
    expect(tag).toEqual(expect.any(String))

    await expect(
      alg.decrypt(decode(ciphertext, Buffer), aad, iv, decode(tag, Buffer), key)
    ).resolves.toEqual(plaintext)
  })
})
