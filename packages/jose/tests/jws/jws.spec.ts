import { InvalidJsonWebSignature } from '../../lib/exceptions'
import { OCTSecretKey, OCTSecretParams } from '../../lib/jwk'
import { decode, encode } from '../../lib/jws'
import { loadSymmetricKey } from '../utils'

const key = new OCTSecretKey(loadSymmetricKey<OCTSecretParams>('oct', 'json'))
const header = { alg: 'HS256' }
const payload = Buffer.from('{"iat": 1723010455, "sub": "078BWDDXasdcg8"}')

const token =
  'eyJhbGciOiJIUzI1NiJ9.' +
  'eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0.' +
  'hRqmKz7sKWQZyNM1Kw9AgqPNOedszPvEADYmNFo8foA'

describe('JSON Web Signature decode()', () => {
  it('should reject an invalid token.', () => {
    expect(() => decode({ token: undefined, key })).toThrow(
      'Invalid parameter "token".'
    )
  })

  it('should reject an invalid JSON Web Key.', () => {
    expect(() =>
      decode({ token: 'b64header.b64payload.signature', key: undefined })
    ).toThrow('Invalid parameter "key".')
  })

  it('should reject a malformed token.', () => {
    expect(() => decode({ token: '', key })).toThrow(InvalidJsonWebSignature)

    expect(() => decode({ token: 'aaa.bbb', key })).toThrow(
      InvalidJsonWebSignature
    )

    expect(() => decode({ token: 'aaa.bbb.ccc', key })).toThrow(
      InvalidJsonWebSignature
    )
  })

  it('should reject conflicting algorithms.', () => {
    expect(() => decode({ token, key, algorithm: 'none' })).toThrow(
      'The algorithm used to sign this token is invalid. ' +
        'Expected "none", got "HS256".'
    )
  })

  it('should not verify the signature when asked so.', () => {
    expect(
      decode({
        token:
          'eyJhbGciOiJIUzI1NiJ9.' +
          'eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0.',
        key,
        validate: false
      })
    ).toMatchObject({ header, payload })
  })

  it('should validate and decode the JSON Web Signature Token.', () => {
    expect(decode({ token, key, algorithm: 'HS256' })).toMatchObject({
      header,
      payload
    })
  })
})

describe('JSON Web Signature encode()', () => {
  it('should reject an invalid header.', () => {
    expect(() => encode({ header: undefined, payload })).toThrow(
      'Invalid parameter "header".'
    )
  })

  it('should reject an invalid payload.', () => {
    expect(() => encode({ header, payload: undefined })).toThrow(
      'Invalid parameter "payload".'
    )

    // @ts-expect-error
    expect(() => encode({ header, payload: { sub: 'user-id' } })).toThrow(
      'Invalid parameter "payload".'
    )
  })

  it('should reject an invalid key.', () => {
    expect(() => encode({ header, payload, key: undefined })).toThrow(
      'Invalid parameter "key".'
    )
  })

  it('should encode a JOSE Header and a Payload into a JWS Token.', () => {
    expect(encode({ header, payload, key })).toEqual(token)
  })
})
