import { Base64Url } from '@guarani/utils'

import { JWE_ALGORITHMS } from '../../../../lib/jwe/algorithms/alg'
import { OctKey } from '../../../../lib/jwk'

const cek = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])

describe('JWE A128GCMKW Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS.A128GCMKW
    const key = new OctKey({ k: 'EBESExQVFhcYGRobHB0eHw' })
    const { ek, header } = await alg.wrap(cek, key)

    expect(ek).toEqual(expect.any(String))

    await expect(
      alg.unwrap(Base64Url.decode(ek), key, header)
    ).resolves.toEqual(cek)
  })
})

describe('JWE A192GCMKW Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS.A192GCMKW
    const key = new OctKey({ k: 'EBESExQVFhcYGRobHB0eHyAhIiMkJSYn' })
    const { ek, header } = await alg.wrap(cek, key)

    expect(ek).toEqual(expect.any(String))

    await expect(
      alg.unwrap(Base64Url.decode(ek), key, header)
    ).resolves.toEqual(cek)
  })
})

describe('JWE A256GCMKW Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS.A256GCMKW
    const key = new OctKey({ k: 'EBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8' })
    const { ek, header } = await alg.wrap(cek, key)

    expect(ek).toEqual(expect.any(String))

    await expect(
      alg.unwrap(Base64Url.decode(ek), key, header)
    ).resolves.toEqual(cek)
  })
})
