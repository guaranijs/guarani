import { InvalidKeySet } from '../../lib/exceptions'
import { EcKey, JsonWebKeySet, RsaKey } from '../../lib/jwk'
import { loadAsymmetricKey } from '../utils'

describe('JSON Web Keyset constructor', () => {
  const ecKey = loadAsymmetricKey<any>('EC', 'json', 'public')
  const rsaKey = loadAsymmetricKey<any>('RSA', 'json', 'public')

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
          new EcKey(ecKey, { kid: 'keyid' }),
          new RsaKey(rsaKey)
        ])
    ).toThrow('One or more keys do not have an ID.')

    expect(
      () =>
        new JsonWebKeySet([
          new EcKey(ecKey, { kid: 'keyid' }),
          new RsaKey(rsaKey, { kid: 'keyid' })
        ])
    ).toThrow(
      'The usage of the same ID for multiple keys in a JWKS is forbidden.'
    )
  })

  it('should create a JsonWebKeySet object.', () => {
    expect(
      new JsonWebKeySet([
        new EcKey(ecKey, { kid: 'ec-key' }),
        new RsaKey(rsaKey, { kid: 'rsa-key' })
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

describe('JSON Web Keyset getKey()', () => {
  const ecKey = loadAsymmetricKey<any>('EC', 'json', 'public')
  const rsaKey = loadAsymmetricKey<any>('RSA', 'json', 'public')
  const keyset = new JsonWebKeySet([
    new EcKey(ecKey, { kid: 'ec-key' }),
    new RsaKey(rsaKey, { kid: 'rsa-key' })
  ])

  it('should find a key based on the provided ID.', () => {
    const key = keyset.getKey<EcKey>('ec-key')

    expect(key).toBeInstanceOf(EcKey)
    expect(key).toMatchObject(ecKey)

    const noKey = keyset.getKey('no-key')

    expect(noKey).toBeUndefined()
  })
})
