import { InvalidKeySet } from '../lib/exceptions'
import {
  ECPublicKey,
  ECPublicParams,
  RSAPublicKey,
  RSAPublicParams
} from '../lib/jwk'

import { JsonWebKeySet } from '../lib/jwks'
import { loadAsymmetricKey } from './utils'

describe('JsonWebKeySet constructor', () => {
  const ecKey = loadAsymmetricKey<ECPublicParams>('EC', 'json', 'public')
  const rsaKey = loadAsymmetricKey<RSAPublicParams>('RSA', 'json', 'public')

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
          new ECPublicKey(ecKey, { kid: 'keyid' }),
          new RSAPublicKey(rsaKey)
        ])
    ).toThrow('One or more keys do not have an ID.')

    expect(
      () =>
        new JsonWebKeySet([
          new ECPublicKey(ecKey, { kid: 'keyid' }),
          new RSAPublicKey(rsaKey, { kid: 'keyid' })
        ])
    ).toThrow(
      'The usage of the same ID for multiple keys in a JWKS is forbidden.'
    )
  })

  it('should create a JsonWebKeySet object.', () => {
    expect(
      new JsonWebKeySet([
        new ECPublicKey(ecKey, { kid: 'ec-key' }),
        new RSAPublicKey(rsaKey, { kid: 'rsa-key' })
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

describe('JsonWebKeySet getKey()', () => {
  const ecKey = loadAsymmetricKey<ECPublicParams>('EC', 'json', 'public')
  const rsaKey = loadAsymmetricKey<RSAPublicParams>('RSA', 'json', 'public')
  const keyset = new JsonWebKeySet([
    new ECPublicKey(ecKey, { kid: 'ec-key' }),
    new RSAPublicKey(rsaKey, { kid: 'rsa-key' })
  ])

  it('should find a key based on the provided ID.', () => {
    const key = keyset.getKey<ECPublicKey>('ec-key')

    expect(key).toBeInstanceOf(ECPublicKey)
    expect(key).toMatchObject(ecKey)
  })
})
