import { decode } from '@guarani/base64url'

import { JWE_ALGORITHMS } from '../../../../lib/jwe/algorithms/alg'
import { OctKey } from '../../../../lib/jwk'

const cek = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])

describe('JWE dir Key Wrapping Algorithm', () => {
  it('should wrap and unwrap a Content Encryption Key.', async () => {
    const alg = JWE_ALGORITHMS.dir
    const key = new OctKey({ k: 'EBESExQVFhcYGRobHB0eHw' })
    const { ek, header } = await alg.wrap(cek, key)

    expect(ek).toEqual('')

    await expect(alg.unwrap(decode(ek, Buffer), key, header)).resolves.toEqual(
      key.export('binary')
    )
  })
})
