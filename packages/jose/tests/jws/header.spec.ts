import { JoseHeader, JWSAlgorithm } from '../../lib/jws'

describe('JSON Web Signature JOSE Header', () => {
  it('should reject an invalid algorithm.', () => {
    expect(() => new JoseHeader({ alg: undefined })).toThrow(
      'Invalid JSON Web Signature Algorithm.'
    )

    // @ts-expect-error
    expect(() => new JoseHeader({ alg: 123 })).toThrow(
      'Invalid JSON Web Signature Algorithm.'
    )
  })

  it('should reject an unsupported algorithm.', () => {
    expect(() => new JoseHeader({ alg: 'unsupported-algorithm' })).toThrow(
      'Invalid JSON Web Signature Algorithm.'
    )
  })

  it('should reject an invalid "kid".', () => {
    // @ts-expect-error
    expect(() => new JoseHeader({ alg: 'none', kid: 123 })).toThrow(
      'Invalid parameter "kid".'
    )
  })

  it('should reject an invalid "crit".', () => {
    // @ts-expect-error
    expect(() => new JoseHeader({ alg: 'none', crit: 123 })).toThrow(
      'Invalid parameter "crit".'
    )

    expect(() => new JoseHeader({ alg: 'none', crit: [] })).toThrow(
      'Invalid parameter "crit".'
    )

    expect(() => new JoseHeader({ alg: 'none', crit: ['kid', null] })).toThrow(
      'Invalid parameter "crit".'
    )

    // @ts-expect-error
    expect(() => new JoseHeader({ alg: 'none', crit: ['kid', 123] })).toThrow(
      'Invalid parameter "crit".'
    )

    expect(() => new JoseHeader({ alg: 'none', crit: ['kid'] })).toThrow(
      'Missing required parameter "kid".'
    )
  })

  it('should create a JOSE Header.', () => {
    expect(new JoseHeader({ alg: 'HS256', kid: 'key-id' })).toMatchObject({
      alg: 'HS256',
      kid: 'key-id'
    })
  })
})

describe('JoseHeader algorithm', () => {
  it('should return a JWSAlgorithm.', () => {
    expect(new JoseHeader({ alg: 'none' }).algorithm).toBeInstanceOf(
      JWSAlgorithm
    )
  })
})
