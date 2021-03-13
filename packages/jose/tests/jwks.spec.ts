import { InvalidKeySet } from '../lib/exceptions'
import { ECParams, RSAParams } from '../lib/jwa/jwk'
import { JsonWebKey } from '../lib/jwk'
import { JsonWebKeySet } from '../lib/jwks'
import { loadAsymmetricKey } from './utils'

describe('JsonWebKeySet constructor', () => {
  const ecKey = loadAsymmetricKey<ECParams>('EC', 'json', 'public')
  const rsaKey = loadAsymmetricKey<RSAParams>('RSA', 'json', 'public')

  it('should reject invalid keysets.', () => {
    expect(() => new JsonWebKeySet(undefined)).toThrow(TypeError)

    // @ts-expect-error
    expect(() => new JsonWebKeySet(123)).toThrow(TypeError)

    expect(() => new JsonWebKeySet([])).toThrow(TypeError)

    // @ts-expect-error
    expect(() => new JsonWebKeySet([123])).toThrow(InvalidKeySet)

    expect(
      () =>
        new JsonWebKeySet([
          new JsonWebKey(ecKey, { kid: 'keyid' }),
          new JsonWebKey(rsaKey)
        ])
    ).toThrow('One or more keys do not have an ID.')

    expect(
      () =>
        new JsonWebKeySet([
          new JsonWebKey(ecKey, { kid: 'keyid' }),
          new JsonWebKey(rsaKey, { kid: 'keyid' })
        ])
    ).toThrow(
      'The usage of the same ID for multiple keys in a JWKS is forbidden.'
    )
  })

  it('should create a JsonWebKeySet object.', () => {
    expect(
      new JsonWebKeySet([
        new JsonWebKey(ecKey, { kid: 'ec-key' }),
        new JsonWebKey(rsaKey, { kid: 'rsa-key' })
      ])
    ).toEqual(
      expect.objectContaining({
        keys: [
          {
            kty: 'EC',
            crv: 'P-256',
            x: expect.any(String),
            y: expect.any(String),
            kid: 'ec-key'
          },
          {
            kty: 'RSA',
            n: expect.any(String),
            e: expect.any(String),
            kid: 'rsa-key'
          }
        ]
      })
    )
  })
})
