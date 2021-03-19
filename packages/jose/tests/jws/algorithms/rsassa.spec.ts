import { createRsaKeyPair } from '../../../lib/jwk'
import { Algorithms } from '../../../lib/jws'

const { publicKey, privateKey } = createRsaKeyPair(2048)

describe('JWS RSASSA-PSS Algorithm PS256', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.PS256()

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})

describe('JWS RSASSA-PSS Algorithm PS384', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.PS384()

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})

describe('JWS RSASSA-PSS Algorithm PS512', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.PS512()

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})

describe('JWS RSASSA-PKCS1-v1_5 Algorithm RS256', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.RS256()

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})

describe('JWS RSASSA-PKCS1-v1_5 Algorithm RS384', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.RS384()

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})

describe('JWS RSASSA-PKCS1-v1_5 Algorithm RS512', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = Algorithms.RS512()

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})
