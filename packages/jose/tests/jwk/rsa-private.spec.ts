import { createPrivateKey } from 'crypto'

import {
  createRsaKeyPair,
  exportRsaPrivateKey,
  parseRsaPrivateKey,
  RSAPrivateKey,
  RSAPrivateParams
} from '../../lib/jwk'

import { loadAsymmetricKey } from '../utils'

describe('RSAPrivateKey constructor', () => {
  const key = loadAsymmetricKey<RSAPrivateParams>('RSA', 'json', 'private')

  it('should reject keys with a wrong parameter "d".', () => {
    const { d, ...params } = key

    expect(() => new RSAPrivateKey({ d: undefined, ...params })).toThrow(
      'Invalid parameter "d".'
    )
  })

  it('should reject keys with a wrong parameter "p".', () => {
    const { p, ...params } = key

    expect(() => new RSAPrivateKey({ p: undefined, ...params })).toThrow(
      'Invalid parameter "p".'
    )
  })

  it('should reject keys with a wrong parameter "q".', () => {
    const { q, ...params } = key

    expect(() => new RSAPrivateKey({ q: undefined, ...params })).toThrow(
      'Invalid parameter "q".'
    )
  })

  it('should reject keys with a wrong parameter "dp".', () => {
    const { dp, ...params } = key

    expect(() => new RSAPrivateKey({ dp: undefined, ...params })).toThrow(
      'Invalid parameter "dp".'
    )
  })

  it('should reject keys with a wrong parameter "dq".', () => {
    const { dq, ...params } = key

    expect(() => new RSAPrivateKey({ dq: undefined, ...params })).toThrow(
      'Invalid parameter "dq".'
    )
  })

  it('should reject keys with a wrong parameter "qi".', () => {
    const { qi, ...params } = key

    expect(() => new RSAPrivateKey({ qi: undefined, ...params })).toThrow(
      'Invalid parameter "qi".'
    )
  })

  it('should create an RSA Private Key.', () => {
    const key = loadAsymmetricKey<RSAPrivateParams>('RSA', 'json', 'private')

    expect(new RSAPrivateKey(key)).toMatchObject({
      kty: 'RSA',
      n: key.n,
      e: key.e,
      d: key.d,
      p: key.p,
      q: key.q,
      dp: key.dp,
      dq: key.dq,
      qi: key.qi
    })
  })
})

describe('RSAPrivateKey privateKey', () => {
  it('should return a valid private key.', () => {
    const jsonKey = loadAsymmetricKey<RSAPrivateParams>(
      'RSA',
      'json',
      'private'
    )
    const pemKey = loadAsymmetricKey('RSA', 'pem', 'private')

    expect(new RSAPrivateKey(jsonKey).privateKey).toEqual(
      createPrivateKey({ key: pemKey, format: 'pem', type: 'pkcs1' })
    )
  })
})

describe('createRsaKeyPair()', () => {
  it('should reject an invalid modulus length.', () => {
    expect(() => createRsaKeyPair(undefined)).toThrow('Invalid modulus length.')
  })

  it('should reject a modulus length smaller than 2048 bits.', () => {
    expect(() => createRsaKeyPair(2040)).toThrow(
      'The modulus MUST be AT LEAST 2048 bits long.'
    )
  })

  it('should create a new RSA Key Pair.', () => {
    const { publicKey, privateKey } = createRsaKeyPair(2048)

    expect(publicKey).toMatchObject({
      kty: 'RSA',
      n: expect.any(String),
      e: expect.any(String)
    })

    expect(privateKey).toMatchObject({
      kty: 'RSA',
      n: expect.any(String),
      e: expect.any(String),
      d: expect.any(String),
      p: expect.any(String),
      q: expect.any(String),
      dp: expect.any(String),
      dq: expect.any(String),
      qi: expect.any(String)
    })
  })
})

describe('parseRsaPrivateKey()', () => {
  const json = loadAsymmetricKey<RSAPrivateParams>('RSA', 'json', 'private')
  const pem = loadAsymmetricKey('RSA', 'pem', 'private')

  it('should reject an invalid PEM key data.', () => {
    expect(() => parseRsaPrivateKey(undefined)).toThrow(TypeError)
  })

  it('should create an RSAPrivateKey object.', () => {
    expect(parseRsaPrivateKey(pem)).toMatchObject(json)
  })
})

describe('exportRsaPrivateKey()', () => {
  const key = new RSAPrivateKey(loadAsymmetricKey('RSA', 'json', 'private'))
  const privateKey = key.privateKey

  it('should reject an invalid key.', () => {
    expect(() => exportRsaPrivateKey(undefined, 'pkcs1')).toThrow(
      'Invalid parameter "key".'
    )
  })

  it('should export a PKCS#1 RSA Private Key.', () => {
    expect(exportRsaPrivateKey(key, 'pkcs1')).toEqual(
      privateKey.export({ format: 'pem', type: 'pkcs1' })
    )
  })

  it('should export a PKCS#8 RSA Private Key.', () => {
    expect(exportRsaPrivateKey(key, 'pkcs8')).toEqual(
      privateKey.export({ format: 'pem', type: 'pkcs8' })
    )
  })
})
