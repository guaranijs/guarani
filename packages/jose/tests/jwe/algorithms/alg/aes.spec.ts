import { Base64Url } from '@guarani/utils'

import { JWE_ALGORITHMS } from '../../../../lib/jwe/algorithms/alg'
import { OctKey } from '../../../../lib/jwk'

const cek = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])

describe('JWE A128KW Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS.A128KW
    const key = new OctKey({ k: 'EBESExQVFhcYGRobHB0eHw' })
    const { ek } = await alg.wrap(cek, key)

    expect(ek).toEqual('Ogu9AxwToenv9SHshBF8S5PKe5Pwh_YY')

    await expect(alg.unwrap(Base64Url.decode(ek), key)).resolves.toEqual(cek)
  })
})

describe('JWE A192KW Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS.A192KW
    const key = new OctKey({ k: 'EBESExQVFhcYGRobHB0eHyAhIiMkJSYn' })
    const { ek } = await alg.wrap(cek, key)

    expect(ek).toEqual('O4K9z37P0CEqdvayE-SC1M74dJGn54St')

    await expect(alg.unwrap(Base64Url.decode(ek), key)).resolves.toEqual(cek)
  })
})

describe('JWE A256KW Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS.A256KW
    const key = new OctKey({ k: 'EBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8' })
    const { ek } = await alg.wrap(cek, key)

    expect(ek).toEqual('VP21n-zeSbHkgD35YR-WLiC-k1MdpmbH')

    await expect(alg.unwrap(Base64Url.decode(ek), key)).resolves.toEqual(cek)
  })
})
