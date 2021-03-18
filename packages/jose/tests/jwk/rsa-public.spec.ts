import { createPublicKey } from 'crypto'

import {
  exportRsaPublicKey,
  parseRsaPublicKey,
  RSAPublicKey,
  RSAPublicParams
} from '../../lib/jwk'

import { loadAsymmetricKey } from '../utils'

describe('RSAPublicKey constructor', () => {
  const key = loadAsymmetricKey<RSAPublicParams>('RSA', 'json', 'public')

  it('should reject a wrong "kty".', () => {
    const { kty, ...params } = key

    expect(() => new RSAPublicKey({ kty: 'wrong', ...params })).toThrow(
      'Invalid parameter "kty". Expected "RSA", got "wrong".'
    )
  })

  it('should reject keys with a wrong parameter "n".', () => {
    const { n, ...params } = key

    expect(() => new RSAPublicKey({ n: undefined, ...params })).toThrow(
      'Invalid parameter "n".'
    )

    expect(() => new RSAPublicKey({ n: 'modulus', ...params })).toThrow(
      'The modulus MUST have AT LEAST 2048 bits.'
    )
  })

  it('should reject keys with a wrong parameter "e".', () => {
    const { e, ...params } = key

    expect(() => new RSAPublicKey({ e: undefined, ...params })).toThrow(
      'Invalid parameter "e".'
    )
  })

  it('should create an RSA Public Key.', () => {
    const key = loadAsymmetricKey<RSAPublicParams>('RSA', 'json', 'public')

    expect(new RSAPublicKey(key)).toMatchObject({
      kty: 'RSA',
      n: key.n,
      e: key.e
    })
  })
})

describe('RSAPublicKey publicKey', () => {
  it('should return a valid public key.', () => {
    const jsonKey = loadAsymmetricKey<RSAPublicParams>('RSA', 'json', 'public')
    const pemKey = loadAsymmetricKey('RSA', 'pem', 'public')

    expect(new RSAPublicKey(jsonKey).publicKey).toEqual(
      createPublicKey({ key: pemKey, format: 'pem', type: 'spki' })
    )
  })
})

describe('parseRsaPublicKey()', () => {
  const json = loadAsymmetricKey<RSAPublicParams>('RSA', 'json', 'public')
  const pem = loadAsymmetricKey('RSA', 'pem', 'public')

  it('should reject an invalid PEM key data.', () => {
    expect(() => parseRsaPublicKey(undefined)).toThrow(TypeError)
  })

  it('should create an RSAPublicKey object.', () => {
    expect(parseRsaPublicKey(pem)).toMatchObject(json)
  })
})

describe('exportRsaPublicKey()', () => {
  const key = new RSAPublicKey(loadAsymmetricKey('RSA', 'json', 'public'))
  const publicKey = key.publicKey

  it('should reject an invalid key.', () => {
    expect(() => exportRsaPublicKey(undefined, 'pkcs1')).toThrow(
      'Invalid parameter "key".'
    )
  })

  it('should export a PKCS#1 RSA Public Key.', () => {
    expect(exportRsaPublicKey(key, 'pkcs1')).toEqual(
      publicKey.export({ format: 'pem', type: 'pkcs1' })
    )
  })

  it('should export an SPKI RSA Public Key.', () => {
    expect(exportRsaPublicKey(key, 'spki')).toEqual(
      publicKey.export({ format: 'pem', type: 'spki' })
    )
  })
})
