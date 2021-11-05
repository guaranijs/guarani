import { OctKey, OctKeyParams } from '../../lib/jwk/algorithms'
import { loadSymmetricKey } from '../utils'

describe('OctKey constructor', () => {
  it('should reject a wrong "kty".', () => {
    expect(
      () =>
        new OctKey({
          // @ts-expect-error
          kty: 'wrong',
          k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ'
        })
    ).toThrow('Invalid parameter "kty". Expected "oct", got "wrong".')
  })

  it('should reject a secret that is not a string.', () => {
    // @ts-expect-error
    expect(() => new OctKey({ k: 123 })).toThrow('Invalid parameter "k".')
  })

  it('should create an OctKey.', () => {
    const secretKey = loadSymmetricKey<OctKeyParams>('oct', 'json')

    expect(new OctKey(secretKey)).toMatchObject({
      kty: 'oct',
      k: secretKey.k
    })
  })
})

describe('OctKey generate()', () => {
  it('should reject an invalid key size.', async () => {
    await expect(OctKey.generate(32.5)).rejects.toThrow(
      'The key size MUST be a valid integer.'
    )
  })

  it('should create a new OctKey.', async () => {
    const key = await OctKey.generate(32)

    expect(key).toBeInstanceOf(OctKey)
    expect(key).toMatchObject({ kty: 'oct', k: expect.any(String) })
  })
})

describe('OctKey parse()', () => {
  it('should create an OctKey object based on a Buffer secret.', () => {
    const json = loadSymmetricKey<OctKeyParams>('oct', 'json')
    const der = Buffer.from(loadSymmetricKey('oct', 'pem'), 'base64')

    expect(OctKey.parse(der)).toMatchObject({
      kty: 'oct',
      k: json.k
    })
  })

  it('should create an OctKey object based on a string secret.', () => {
    const json = loadSymmetricKey<OctKeyParams>('oct', 'json')
    const pem = loadSymmetricKey('oct', 'pem')

    expect(OctKey.parse(pem)).toMatchObject({
      kty: 'oct',
      k: json.k
    })
  })
})

describe('OctKey export()', () => {
  const jsonKey = loadSymmetricKey<OctKeyParams>('oct', 'json')
  const pemKey = loadSymmetricKey('oct', 'pem')
  const derKey = Buffer.from(pemKey, 'base64')
  const secretKey = new OctKey(jsonKey)

  it('should export a Base64 representation of the secret.', () => {
    expect(secretKey.export('base64')).toEqual(pemKey)
  })

  it('should export a Binary representation of the secret.', () => {
    expect(secretKey.export('binary')).toEqual(derKey)
  })
})
