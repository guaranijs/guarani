import { none } from '../../../lib/jws/algorithms/none'

describe('JWS none Algorithm', () => {
  const message = Buffer.from('Super secret message.')

  it('should sign and verify a message.', async () => {
    await expect(none.sign(message)).resolves.toEqual('')

    await expect(none.verify('', message)).resolves.not.toThrow()
  })
})
