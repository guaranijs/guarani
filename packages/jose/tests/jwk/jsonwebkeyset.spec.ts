import { InvalidKeyset } from '../../lib/exceptions'
import { EcKey, JsonWebKeyset, RsaKey } from '../../lib/jwk'
import { loadAsymmetricKey } from '../utils'

describe('JSON Web Keyset constructor', () => {
  const ecKey = loadAsymmetricKey<any>('EC', 'json', 'public')
  const rsaKey = loadAsymmetricKey<any>('RSA', 'json', 'public')

  it('should reject invalid keysets.', () => {
    // @ts-expect-error
    expect(() => new JsonWebKeyset(123)).toThrow(TypeError)

    expect(() => new JsonWebKeyset([])).toThrow(TypeError)

    // @ts-expect-error
    expect(() => new JsonWebKeyset([123])).toThrow(InvalidKeyset)

    expect(
      () =>
        new JsonWebKeyset([
          new EcKey(ecKey, { kid: 'keyid' }),
          new RsaKey(rsaKey)
        ])
    ).toThrow('One or more keys do not have an ID.')

    expect(
      () =>
        new JsonWebKeyset([
          new EcKey(ecKey, { kid: 'keyid' }),
          new RsaKey(rsaKey, { kid: 'keyid' })
        ])
    ).toThrow(
      'The usage of the same ID for multiple keys in a JWKS is forbidden.'
    )
  })

  it('should create a JsonWebKeyset object.', () => {
    expect(
      new JsonWebKeyset([
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

  it('should parse a raw JSON Web Keyset object.', () => {
    expect(() => JsonWebKeyset.parse(null)).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse(true)).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse(123)).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse('foo')).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse(() => {})).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse([])).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse({})).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse({ keys: null })).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse({ keys: true })).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse({ keys: 123 })).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse({ keys: 'foo' })).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse({ keys: () => {} })).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse({ keys: {} })).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse({ keys: [] })).toThrow(InvalidKeyset)

    expect(() => JsonWebKeyset.parse({ keys: [{}] })).toThrow(InvalidKeyset)

    const jwks = JsonWebKeyset.parse({
      keys: [{ kty: 'oct', k: 'secret', kid: 'key-id' }]
    })

    expect(jwks).toBeInstanceOf(JsonWebKeyset)

    expect(jwks.keys).toHaveLength(1)

    expect(jwks.keys[0]).toMatchObject({
      kty: 'oct',
      k: 'secret',
      kid: 'key-id'
    })
  })
})

describe('JSON Web Keyset getKey()', () => {
  const ecKey = loadAsymmetricKey<any>('EC', 'json', 'public')
  const rsaKey = loadAsymmetricKey<any>('RSA', 'json', 'public')
  const keyset = new JsonWebKeyset([
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
