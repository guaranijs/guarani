import { InvalidKey } from '../../../lib/exceptions'
import { createEcKeyPair } from '../../../lib/jwk'
import { Algorithms } from '../../../lib/jws'

describe('JWS ECDSA Algorithm ES256', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.ES256()
  const { publicKey, privateKey } = createEcKeyPair('P-256')

  it('should reject a different curve.', () => {
    expect(() =>
      algorithm.sign(message, createEcKeyPair('P-384').privateKey)
    ).toThrow(InvalidKey)
  })

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})

describe('JWS ECDSA Algorithm ES384', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.ES384()
  const { publicKey, privateKey } = createEcKeyPair('P-384')

  it('should reject a different curve.', () => {
    expect(() =>
      algorithm.sign(message, createEcKeyPair('P-521').privateKey)
    ).toThrow(InvalidKey)
  })

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})

describe('JWS ECDSA Algorithm ES512', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.ES512()
  const { publicKey, privateKey } = createEcKeyPair('P-521')

  it('should reject a different curve.', () => {
    expect(() =>
      algorithm.sign(message, createEcKeyPair('P-256').privateKey)
    ).toThrow(InvalidKey)
  })

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})
