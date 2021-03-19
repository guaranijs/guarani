import { InvalidKey } from '../../../lib/exceptions'
import { createOctSecretKey } from '../../../lib/jwk'
import { Algorithms } from '../../../lib/jws'

describe('JWS HMAC Algorithm HS256', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.HS256()
  const secretKey = createOctSecretKey(32)

  it('should reject a secret too small.', () => {
    expect(() => algorithm.sign(message, createOctSecretKey(31))).toThrow(
      InvalidKey
    )
  })

  it('should sign a message.', () => {
    expect(algorithm.sign(message, secretKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, secretKey)

    expect(() => algorithm.verify(signature, message, secretKey)).not.toThrow()
  })
})

describe('JWS HMAC Algorithm HS384', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.HS384()
  const secretKey = createOctSecretKey(48)

  it('should reject a secret too small.', () => {
    expect(() => algorithm.sign(message, createOctSecretKey(47))).toThrow(
      InvalidKey
    )
  })

  it('should sign a message.', () => {
    expect(algorithm.sign(message, secretKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, secretKey)

    expect(() => algorithm.verify(signature, message, secretKey)).not.toThrow()
  })
})

describe('JWS HMAC Algorithm HS512', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.HS512()
  const secretKey = createOctSecretKey(64)

  it('should reject a secret too small.', () => {
    expect(() => algorithm.sign(message, createOctSecretKey(63))).toThrow(
      InvalidKey
    )
  })

  it('should sign a message.', () => {
    expect(algorithm.sign(message, secretKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, secretKey)

    expect(() => algorithm.verify(signature, message, secretKey)).not.toThrow()
  })
})
