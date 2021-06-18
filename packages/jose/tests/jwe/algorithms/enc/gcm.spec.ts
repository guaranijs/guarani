import { Base64Url } from '@guarani/utils'

import { JWE_ENCRYPTIONS } from '../../../../lib/jwe/algorithms/enc'

const plaintext = Buffer.from('Super secret message.')
const aad = Buffer.alloc(0)

describe('JWE A128GCM Content Encryption Algorithm', () => {
  it('should encrypt and decrypt a message.', async () => {
    const alg = JWE_ENCRYPTIONS.A128GCM
    const iv = alg.generateIV()
    const key = alg.generateCEK()
    const { ciphertext, tag } = await alg.encrypt(plaintext, aad, iv, key)

    expect(ciphertext).toEqual(expect.any(String))
    expect(tag).toEqual(expect.any(String))

    await expect(
      alg.decrypt(
        Base64Url.decode(ciphertext),
        aad,
        iv,
        Base64Url.decode(tag),
        key
      )
    ).resolves.toEqual(plaintext)
  })
})

describe('JWE A192GCM Content Encryption Algorithm', () => {
  it('should encrypt and decrypt a message.', async () => {
    const alg = JWE_ENCRYPTIONS.A192GCM
    const iv = alg.generateIV()
    const key = alg.generateCEK()
    const { ciphertext, tag } = await alg.encrypt(plaintext, aad, iv, key)

    expect(ciphertext).toEqual(expect.any(String))
    expect(tag).toEqual(expect.any(String))

    await expect(
      alg.decrypt(
        Base64Url.decode(ciphertext),
        aad,
        iv,
        Base64Url.decode(tag),
        key
      )
    ).resolves.toEqual(plaintext)
  })
})

describe('JWE A256GCM Content Encryption Algorithm', () => {
  it('should encrypt and decrypt a message.', async () => {
    const alg = JWE_ENCRYPTIONS.A256GCM
    const iv = alg.generateIV()
    const key = alg.generateCEK()
    const { ciphertext, tag } = await alg.encrypt(plaintext, aad, iv, key)

    expect(ciphertext).toEqual(expect.any(String))
    expect(tag).toEqual(expect.any(String))

    await expect(
      alg.decrypt(
        Base64Url.decode(ciphertext),
        aad,
        iv,
        Base64Url.decode(tag),
        key
      )
    ).resolves.toEqual(plaintext)
  })
})
