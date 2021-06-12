import { InvalidJoseHeader } from '../../lib/exceptions'
import { JsonWebSignatureHeader, JWSHeaderParams } from '../../lib/jws'
import { JWS_ALGORITHMS } from '../../lib/jws/algorithms'

describe('JSON Web Signature JOSE Header', () => {
  it('should reject an invalid algorithm.', () => {
    expect(() => new JsonWebSignatureHeader({ alg: undefined })).toThrow(
      'Missing required parameter "alg".'
    )

    // @ts-expect-error
    expect(() => new JsonWebSignatureHeader({ alg: '' })).toThrow(
      'Missing required parameter "alg".'
    )

    // @ts-expect-error
    expect(() => new JsonWebSignatureHeader({ alg: 123 })).toThrow(
      'Invalid parameter "alg".'
    )
  })

  it('should reject an unsupported algorithm.', () => {
    expect(
      // @ts-expect-error
      () => new JsonWebSignatureHeader({ alg: 'unsupported-algorithm' })
    ).toThrow('Invalid JSON Web Signature Algorithm.')
  })

  it('should reject an invalid "kid".', () => {
    // @ts-expect-error
    expect(() => new JsonWebSignatureHeader({ alg: 'none', kid: 123 })).toThrow(
      'Invalid parameter "kid".'
    )
  })

  it('should reject an invalid "crit".', () => {
    expect(
      // @ts-expect-error
      () => new JsonWebSignatureHeader({ alg: 'none', crit: 123 })
    ).toThrow('Invalid parameter "crit".')

    expect(() => new JsonWebSignatureHeader({ alg: 'none', crit: [] })).toThrow(
      'Invalid parameter "crit".'
    )

    expect(
      () => new JsonWebSignatureHeader({ alg: 'none', crit: ['kid', null] })
    ).toThrow('Invalid parameter "crit".')

    expect(
      // @ts-expect-error
      () => new JsonWebSignatureHeader({ alg: 'none', crit: ['kid', 123] })
    ).toThrow('Invalid parameter "crit".')

    expect(
      () => new JsonWebSignatureHeader({ alg: 'none', crit: ['kid'] })
    ).toThrow('Missing required parameter "kid".')
  })

  it('should create a JOSE Header.', () => {
    expect(
      new JsonWebSignatureHeader({ alg: 'HS256', kid: 'key-id' })
    ).toMatchObject({ alg: 'HS256', kid: 'key-id' })
  })

  it('should return a JWSAlgorithm.', () => {
    const header = new JsonWebSignatureHeader({ alg: 'none' })
    expect(JWS_ALGORITHMS[header.alg]).toBe(JWS_ALGORITHMS.none)
  })
})

describe('JSON Web Signature JOSE Headers', () => {
  it('should reject no header being passed.', () => {
    expect(() => new JsonWebSignatureHeader({})).toThrow(InvalidJoseHeader)
  })

  it('should reject an invalid algorithm.', () => {
    expect(
      () => new JsonWebSignatureHeader({ protectedHeader: { alg: undefined } })
    ).toThrow('Missing required parameter "alg".')

    expect(
      // @ts-expect-error
      () => new JsonWebSignatureHeader({ unprotectedHeader: { alg: '' } })
    ).toThrow('Missing required parameter "alg".')

    expect(
      // @ts-expect-error
      () => new JsonWebSignatureHeader({ protectedHeader: { alg: 123 } })
    ).toThrow('Invalid parameter "alg".')
  })

  it('should set a JWS Protected Header.', () => {
    const protectedHeader = <JWSHeaderParams>{ alg: 'none', kid: 'key-id' }
    const jwsHeader = new JsonWebSignatureHeader({ protectedHeader })

    expect(jwsHeader.protectedHeader).toMatchObject(protectedHeader)

    expect(jwsHeader.unprotectedHeader).toBeUndefined()

    expect(JWS_ALGORITHMS[jwsHeader.alg]).toBe(JWS_ALGORITHMS.none)
  })

  it('should set a JWS Unprotected Header.', () => {
    const unprotectedHeader = <JWSHeaderParams>{ alg: 'HS256', kid: 'key-id' }
    const jwsHeader = new JsonWebSignatureHeader({ unprotectedHeader })

    expect(jwsHeader.protectedHeader).toBeUndefined()

    expect(jwsHeader.unprotectedHeader).toMatchObject(unprotectedHeader)

    expect(JWS_ALGORITHMS[jwsHeader.alg]).toBe(JWS_ALGORITHMS.HS256)
  })

  it('should merge both headers into the properties of the header.', () => {
    const protectedHeader = <JWSHeaderParams>{ alg: 'RS512' }
    const unprotectedHeader = { kid: 'key-id' }
    const jwsHeader = new JsonWebSignatureHeader({
      protectedHeader,
      unprotectedHeader
    })

    expect(jwsHeader.protectedHeader).toMatchObject(protectedHeader)

    expect(jwsHeader.unprotectedHeader).toMatchObject(unprotectedHeader)

    expect(jwsHeader).toMatchObject({
      ...protectedHeader,
      ...unprotectedHeader
    })

    expect(JWS_ALGORITHMS[jwsHeader.alg]).toBe(JWS_ALGORITHMS.RS512)
  })
})
