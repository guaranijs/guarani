import { createPrivateKey, createPublicKey, createSecretKey } from 'crypto'

import { UnsupportedAlgorithm } from '../lib/exceptions'
import { ECParams, OCTParams, RSAParams } from '../lib/jwa/jwk'
import { JsonWebKey } from '../lib/jwk'
import { loadAsymmetricKey, loadSymmetricKey } from './utils'

describe('JsonWebKey constructor', () => {
  const key = loadSymmetricKey<OCTParams>('oct', 'json')

  it('should reject invalid keys.', () => {
    expect(() => new JsonWebKey(undefined)).toThrow(TypeError)
  })

  it('should reject unsupported algorithms.', () => {
    expect(() => new JsonWebKey({ kty: null })).toThrow(UnsupportedAlgorithm)
    expect(() => new JsonWebKey({ kty: '(Q%$X' })).toThrow(UnsupportedAlgorithm)
  })

  it('should reject an invalid "use".', () => {
    // @ts-expect-error
    expect(() => new JsonWebKey(key, { use: 123 })).toThrow(
      'Invalid parameter "use".'
    )
  })

  it('should reject an invalid "key_ops".', () => {
    // @ts-expect-error
    expect(() => new JsonWebKey(key, { key_ops: 123 })).toThrow(
      'Invalid parameter "key_ops".'
    )

    expect(
      () => new JsonWebKey(key, { key_ops: ['sign', 'sign', 'verify'] })
    ).toThrow('Parameter "key_ops" cannot have repeated operations.')

    expect(
      () => new JsonWebKey(key, { use: 'sig', key_ops: ['encrypt'] })
    ).toThrow('Invalid combination of "use" and "key_ops".')

    expect(
      () => new JsonWebKey(key, { use: 'enc', key_ops: ['verify'] })
    ).toThrow('Invalid combination of "use" and "key_ops".')
  })

  it('should reject an invalid "alg".', () => {
    // @ts-expect-error
    expect(() => new JsonWebKey(key, { alg: 123 })).toThrow(
      'Invalid parameter "alg".'
    )
  })

  it('should reject an invalid "kid".', () => {
    // @ts-expect-error
    expect(() => new JsonWebKey(key, { kid: 123 })).toThrow(
      'Invalid parameter "kid".'
    )
  })

  it('should create a JsonWebKey object.', () => {
    expect(
      new JsonWebKey<OCTParams>(key, { use: 'sig', kid: 'keyid' })
    ).toMatchObject({
      kty: 'oct',
      k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
      use: 'sig',
      kid: 'keyid'
    })
  })
})

describe('JsonWebKey create()', () => {
  it('should create an instance of a JsonWebKey.', () => {
    expect(
      JsonWebKey.create('EC', 'P-256', { use: 'sig', kid: 'keyid' })
    ).toEqual(
      expect.objectContaining({
        kty: 'EC',
        crv: 'P-256',
        x: expect.any(String),
        y: expect.any(String),
        d: expect.any(String),
        use: 'sig',
        kid: 'keyid'
      })
    )
  })
})

describe('JsonWebKey parse()', () => {
  const pem = loadSymmetricKey('oct', 'pem')
  const key = loadSymmetricKey<OCTParams>('oct', 'json')

  it('should parse a PEM key into a JsonWebKey object.', () => {
    expect(
      JsonWebKey.parse('oct', pem, 'secret', { use: 'sig', kid: 'keyid' })
    ).toMatchObject({ kty: key.kty, k: key.k, use: 'sig', kid: 'keyid' })
  })
})

const secretKey = loadSymmetricKey<OCTParams>('oct', 'json')
const publicKey = loadAsymmetricKey<RSAParams>('RSA', 'json', 'public')
const privateKey = loadAsymmetricKey<ECParams>('EC', 'json', 'private')

describe('JsonWebKey secretKey', () => {
  it('should fail on asymmetric keys.', () => {
    expect(() => new JsonWebKey(publicKey).secretKey).toThrow(
      'This algorithm does not have a secret key.'
    )
  })

  it('should return a NodeJS secretKey KeyObject.', () => {
    expect(new JsonWebKey(secretKey).secretKey).toEqual(
      createSecretKey(Buffer.from(loadSymmetricKey('oct', 'pem'), 'base64'))
    )
  })
})

describe('JsonWebKey publicKey', () => {
  it('should fail on symmetric keys.', () => {
    expect(() => new JsonWebKey(secretKey).publicKey).toThrow(
      'This algorithm does not have a public key.'
    )
  })

  it('should return a NodeJS publicKey KeyObject.', () => {
    expect(new JsonWebKey(publicKey).publicKey).toEqual(
      createPublicKey({
        key: loadAsymmetricKey('RSA', 'pem', 'public'),
        format: 'pem',
        type: 'spki'
      })
    )
  })
})

describe('JsonWebKey privateKey', () => {
  it('should fail on symmetric keys.', () => {
    expect(() => new JsonWebKey(secretKey).privateKey).toThrow(
      'This algorithm does not have a private key.'
    )
  })

  it('should return a NodeJS privateKey KeyObject.', () => {
    expect(new JsonWebKey(privateKey).privateKey).toEqual(
      createPrivateKey({
        key: loadAsymmetricKey('EC', 'pem', 'private'),
        format: 'pem',
        type: 'sec1'
      })
    )
  })
})
