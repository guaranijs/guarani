import { none } from '../../../lib/jws/algorithms'

describe('JWS none Algorithm', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = none()

  it('should sign and verify a message.', () => {
    expect(algorithm.sign(message)).toEqual('')
    expect(() => algorithm.verify('', message)).not.toThrow()
  })
})
