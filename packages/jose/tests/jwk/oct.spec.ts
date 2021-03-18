import { createSecretKey } from 'crypto'

import {
  createOctSecretKey,
  exportOctSecretKey,
  OCTSecretKey,
  OCTSecretParams,
  parseOctSecretKey
} from '../../lib/jwk'

import { loadSymmetricKey } from '../utils'

describe("OCTSecretKey's constructor", () => {
  it('should reject a wrong "kty".', () => {
    expect(
      () =>
        new OCTSecretKey({
          kty: 'wrong',
          k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ'
        })
    ).toThrow('Invalid parameter "kty". Expected "oct", got "wrong".')
  })

  it('should reject a secret that is not a string.', () => {
    expect(() => new OCTSecretKey({ k: undefined })).toThrow(
      'Invalid parameter "k".'
    )
  })

  it('should reject a decoded secret that is shorter than 32 bytes.', () => {
    expect(() => new OCTSecretKey({ k: 'shortkey' })).toThrow(
      'The key size MUST be AT LEAST 32 bytes.'
    )
  })

  it('should create a key from an object.', () => {
    const secretKey = loadSymmetricKey<OCTSecretParams>('oct', 'json')

    expect(new OCTSecretKey(secretKey)).toMatchObject({
      kty: 'oct',
      k: secretKey.k
    })
  })
})

describe("OCTSecretKey's secretKey", () => {
  it('should return a valid secretKey.', () => {
    const jsonKey = loadSymmetricKey<OCTSecretParams>('oct', 'json')
    const pemKey = loadSymmetricKey('oct', 'pem')

    expect(new OCTSecretKey(jsonKey).secretKey).toEqual(
      createSecretKey(Buffer.from(pemKey, 'base64'))
    )
  })
})

describe('createOctSecretKey()', () => {
  it('should reject an invalid key size.', () => {
    expect(() => createOctSecretKey(undefined)).toThrow(
      'The key size MUST be a valid integer.'
    )

    expect(() => createOctSecretKey(32.5)).toThrow(
      'The key size MUST be a valid integer.'
    )
  })

  it('should reject a key size smaller than 32 bytes.', () => {
    expect(() => createOctSecretKey(31)).toThrow(
      'The key size MUST be AT LEAST 32 bytes.'
    )
  })

  it('should create a new OCTSecretKey.', () => {
    const key = createOctSecretKey(32)

    expect(key).toBeInstanceOf(OCTSecretKey)
    expect(key).toEqual(expect.objectContaining({ k: expect.any(String) }))
  })
})

describe('parseOctSecretKey()', () => {
  it('should reject data that is not a valid string.', () => {
    expect(() => parseOctSecretKey(undefined)).toThrow(TypeError)
  })

  it('should create an OCTSecretKey object.', () => {
    const json = loadSymmetricKey<OCTSecretParams>('oct', 'json')
    const pem = loadSymmetricKey('oct', 'pem')

    expect(parseOctSecretKey(pem)).toMatchObject({
      kty: 'oct',
      k: json.k
    })
  })
})

describe('exportOctSecretKey()', () => {
  it('should export a Base64 representation of the secret.', () => {
    const jsonKey = loadSymmetricKey<OCTSecretParams>('oct', 'json')
    const pemKey = loadSymmetricKey('oct', 'pem')
    const secretKey = new OCTSecretKey(jsonKey)

    expect(() => exportOctSecretKey(undefined)).toThrow(
      'Invalid parameter "key".'
    )

    expect(exportOctSecretKey(secretKey)).toEqual(pemKey)
  })
})
