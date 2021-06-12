import { InvalidKey } from '../../../lib/exceptions'
import { EcKey } from '../../../lib/jwk'
import { ES256, ES384, ES512 } from '../../../lib/jws/algorithms/ecdsa'

describe('JWS ECDSA Algorithm ES256', () => {
  const message = Buffer.from('Super secret message.')

  it('should reject a different curve.', async () => {
    await expect(
      async () => await ES256.sign(message, await EcKey.generate('P-384'))
    ).rejects.toThrow(InvalidKey)
  })

  it('should sign and verify a message.', async () => {
    const key = await EcKey.generate('P-256')
    const signature = await ES256.sign(message, key)

    expect(signature).toEqual(expect.any(String))

    await expect(ES256.verify(signature, message, key)).resolves.not.toThrow()
  })
})

describe('JWS ECDSA Algorithm ES384', () => {
  const message = Buffer.from('Super secret message.')

  it('should reject a different curve.', async () => {
    await expect(
      async () => await ES384.sign(message, await EcKey.generate('P-521'))
    ).rejects.toThrow(InvalidKey)
  })

  it('should sign and verify a message.', async () => {
    const key = await EcKey.generate('P-384')
    const signature = await ES384.sign(message, key)

    expect(signature).toEqual(expect.any(String))

    await expect(ES384.verify(signature, message, key)).resolves.not.toThrow()
  })
})

describe('JWS ECDSA Algorithm ES512', () => {
  const message = Buffer.from('Super secret message.')

  it('should reject a different curve.', async () => {
    await expect(
      async () => await ES512.sign(message, await EcKey.generate('P-256'))
    ).rejects.toThrow(InvalidKey)
  })

  it('should sign a message.', async () => {
    const key = await EcKey.generate('P-521')
    const signature = await ES512.sign(message, key)

    expect(signature).toEqual(expect.any(String))

    await expect(ES512.verify(signature, message, key)).resolves.not.toThrow()
  })
})
