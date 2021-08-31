import { base64UrlDecode } from '@guarani/utils'

import { JWE_ENCRYPTIONS } from '../../../../lib/jwe/algorithms/enc'

const plaintext = Buffer.from('Super secret message.')
const aad = Buffer.alloc(0)

describe('JWE A128CBC-HS256 Content Encryption Algorithm', () => {
  it('should encrypt and decrypt a message.', async () => {
    const alg = JWE_ENCRYPTIONS['A128CBC-HS256']
    const iv = alg.generateIV()
    const key = alg.generateCEK()
    const { ciphertext, tag } = await alg.encrypt(plaintext, aad, iv, key)

    expect(ciphertext).toEqual(expect.any(String))
    expect(tag).toEqual(expect.any(String))

    await expect(
      alg.decrypt(
        base64UrlDecode(ciphertext),
        aad,
        iv,
        base64UrlDecode(tag),
        key
      )
    ).resolves.toEqual(plaintext)
  })
})

describe('JWE A192CBC-HS384 Content Encryption Algorithm', () => {
  it('should encrypt and decrypt a message.', async () => {
    const alg = JWE_ENCRYPTIONS['A192CBC-HS384']
    const iv = alg.generateIV()
    const key = alg.generateCEK()
    const { ciphertext, tag } = await alg.encrypt(plaintext, aad, iv, key)

    expect(ciphertext).toEqual(expect.any(String))
    expect(tag).toEqual(expect.any(String))

    await expect(
      alg.decrypt(
        base64UrlDecode(ciphertext),
        aad,
        iv,
        base64UrlDecode(tag),
        key
      )
    ).resolves.toEqual(plaintext)
  })
})

describe('JWE A256CBC-HS512 Content Encryption Algorithm', () => {
  it('should encrypt and decrypt a message.', async () => {
    const alg = JWE_ENCRYPTIONS['A256CBC-HS512']
    const iv = alg.generateIV()
    const key = alg.generateCEK()
    const { ciphertext, tag } = await alg.encrypt(plaintext, aad, iv, key)

    expect(ciphertext).toEqual(expect.any(String))
    expect(tag).toEqual(expect.any(String))

    await expect(
      alg.decrypt(
        base64UrlDecode(ciphertext),
        aad,
        iv,
        base64UrlDecode(tag),
        key
      )
    ).resolves.toEqual(plaintext)
  })
})
