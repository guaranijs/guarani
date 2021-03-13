import { createSecretKey } from 'crypto'

import { createOctKey, OCTKey, OCTParams, parseOctKey } from '../../../lib/jwa'
import { loadSymmetricKey } from '../../utils'

describe("OCTKey's constructor", () => {
  it('should reject a wrong "kty".', () => {
    expect(
      () =>
        new OCTKey({
          kty: 'wrong',
          k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ'
        })
    ).toThrow('Invalid parameter "kty". Expected "oct", got "wrong".')
  })

  it('should reject a secret that is not a string.', () => {
    expect(() => new OCTKey({ kty: 'oct', k: undefined })).toThrow(
      'Invalid parameter "k".'
    )
  })

  it('should reject a decoded secret that is shorter than 32 bytes.', () => {
    expect(() => new OCTKey({ kty: 'oct', k: 'shortkey' })).toThrow(
      'The key size MUST be AT LEAST 32 bytes.'
    )
  })

  it('should create a key from an object.', () => {
    const secretKey = loadSymmetricKey<OCTParams>('oct', 'json')

    expect(new OCTKey(secretKey)).toMatchObject({
      k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ'
    })
  })
})

describe("OCTKey's getSecretKey()", () => {
  it('should return a valid secretKey.', () => {
    const jsonKey = loadSymmetricKey<OCTParams>('oct', 'json')
    const pemKey = loadSymmetricKey('oct', 'pem')

    expect(new OCTKey(jsonKey).getSecretKey()).toEqual(
      createSecretKey(Buffer.from(pemKey, 'base64'))
    )
  })
})

describe("OCTKey's export()", () => {
  it('should export a Base64 representation of the secret.', () => {
    const jsonKey = loadSymmetricKey<OCTParams>('oct', 'json')
    const pemKey = loadSymmetricKey('oct', 'pem')

    expect(new OCTKey(jsonKey).export()).toEqual(pemKey)
  })
})

describe('createOctKey()', () => {
  it('should reject an invalid key size.', () => {
    expect(() => createOctKey(undefined)).toThrow(
      'The key size MUST be a valid integer.'
    )
  })

  it('should reject a key size smaller than 32 bytes.', () => {
    expect(() => createOctKey(31)).toThrow(
      'The key size MUST be AT LEAST 32 bytes.'
    )
  })

  it('should create a new OCTKey.', () => {
    const key = createOctKey(32)

    expect(key).toBeInstanceOf(OCTKey)
    expect(key).toEqual(expect.objectContaining({ k: expect.any(String) }))
  })
})

describe('parseOctKey()', () => {
  it('should reject data that is not a valid string.', () => {
    expect(() => parseOctKey(undefined)).toThrow(TypeError)
  })

  it('should create an OCTKey object.', () => {
    expect(parseOctKey(loadSymmetricKey('oct', 'pem'))).toEqual(
      expect.objectContaining({
        k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ'
      })
    )
  })
})
