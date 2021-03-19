import { Algorithms } from '../../../lib/jws'

describe('JWS none Algorithm', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.none()

  it('should sign and verify a message.', () => {
    expect(algorithm.sign(message)).toEqual('')
    expect(() => algorithm.verify('', message)).not.toThrow()
  })
})
