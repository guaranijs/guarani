import { createRsaKeyPair } from '../../../lib/jwk'
import {
  PS256,
  PS384,
  PS512,
  RS256,
  RS384,
  RS512
} from '../../../lib/jws/algorithms'

const { publicKey, privateKey } = createRsaKeyPair(2048)

describe('JWS RSASSA-PSS Algorithm PS256', () => {
  const message = Buffer.from('Super secret message.')
  const algorithm = PS256()

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
  const algorithm = PS384()

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
  const algorithm = PS512()

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
  const algorithm = RS256()

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
  const algorithm = RS384()

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
  const algorithm = RS512()

  it('should sign a message.', () => {
    expect(algorithm.sign(message, privateKey)).toEqual(expect.any(String))
  })

  it('should verify a message.', () => {
    const signature = algorithm.sign(message, privateKey)

    expect(() => algorithm.verify(signature, message, publicKey)).not.toThrow()
  })
})
