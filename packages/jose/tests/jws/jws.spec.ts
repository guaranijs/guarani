import { InvalidJsonWebSignature } from '../../lib/exceptions'
import { OCTSecretKey, OCTSecretParams } from '../../lib/jwk'
import { createJWS, parseJWS } from '../../lib/jws'
import { loadSymmetricKey } from '../utils'

const key = new OCTSecretKey(loadSymmetricKey<OCTSecretParams>('oct', 'json'))
const header = { alg: 'HS256' }
const payload = Buffer.from('{"iat": 1723010455, "sub": "078BWDDXasdcg8"}')

const token =
  'eyJhbGciOiJIUzI1NiJ9.' +
  'eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0.' +
  'hRqmKz7sKWQZyNM1Kw9AgqPNOedszPvEADYmNFo8foA'

describe('JSON Web Signature createJWS()', () => {
  it('should reject an invalid header.', () => {
    expect(() => createJWS({ header: undefined, payload })).toThrow(
      'Invalid parameter "header".'
    )
  })

  it('should reject an invalid payload.', () => {
    expect(() => createJWS({ header, payload: undefined })).toThrow(
      'Invalid parameter "payload".'
    )

    // @ts-expect-error
    expect(() => createJWS({ header, payload: { sub: 'user-id' } })).toThrow(
      'Invalid parameter "payload".'
    )
  })

  it('should reject an invalid key.', () => {
    expect(() => createJWS({ header, payload, key: undefined })).toThrow(
      'Invalid parameter "key".'
    )
  })

  it('should encode a JOSE Header and a Payload into a JWS Token.', () => {
    expect(createJWS({ header, payload, key })).toEqual(token)
  })
})

describe('JSON Web Signature parseJWS()', () => {
  it('should reject an invalid token.', () => {
    expect(() => parseJWS({ token: undefined, key })).toThrow(
      'Invalid parameter "token".'
    )
  })

  it('should reject an invalid JSON Web Key.', () => {
    expect(() =>
      // @ts-expect-error
      parseJWS({ token: 'b64header.b64payload.signature', key: 123 })
    ).toThrow('Invalid parameter "key".')
  })

  it('should reject a malformed token.', () => {
    expect(() => parseJWS({ token: '', key })).toThrow(InvalidJsonWebSignature)

    expect(() => parseJWS({ token: 'aaa.bbb', key })).toThrow(
      InvalidJsonWebSignature
    )

    expect(() => parseJWS({ token: 'aaa.bbb.ccc', key })).toThrow(
      InvalidJsonWebSignature
    )
  })

  it('should reject conflicting algorithms.', () => {
    expect(() => parseJWS({ token, key, algorithm: 'none' })).toThrow(
      'The algorithm used to sign this token is invalid. ' +
        'Expected "none", got "HS256".'
    )
  })

  it('should not verify the signature when asked so.', () => {
    expect(
      parseJWS({
        token:
          'eyJhbGciOiJIUzI1NiJ9.' +
          'eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0.',
        key,
        validate: false
      })
    ).toMatchObject({ header, payload })
  })

  it('should validate and decode the JSON Web Signature Token.', () => {
    expect(parseJWS({ token, key, algorithm: 'HS256' })).toMatchObject({
      header,
      payload
    })
  })
})
