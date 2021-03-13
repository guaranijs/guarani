import { createPrivateKey, createPublicKey } from 'crypto'

import {
  createRsaKey,
  InvalidKey,
  parseRsaKey,
  RSAKey,
  RSAParams
} from '../../../lib'
import { loadAsymmetricKey } from '../../utils'

describe('RSAKey constructor', () => {
  const publicKey = loadAsymmetricKey<RSAParams>('RSA', 'json', 'public')

  it('should reject a wrong "kty".', () => {
    const { kty, ...key } = publicKey

    expect(() => new RSAKey({ kty: 'wrong', ...key })).toThrow(
      'Invalid parameter "kty". Expected "RSA", got "wrong".'
    )
  })

  it('should reject keys without "n" or "e".', () => {
    const { n, e, ...key } = publicKey

    expect(() => new RSAKey({ n: undefined, e, ...key })).toThrow(
      'Invalid parameter "n".'
    )

    expect(() => new RSAKey({ n, e: undefined, ...key })).toThrow(
      'Invalid parameter "e".'
    )
  })

  it('should create a Public Key.', () => {
    const key = loadAsymmetricKey<RSAParams>('RSA', 'json', 'public')
    expect(new RSAKey(key)).toMatchObject({ n: key.n, e: key.e })
  })

  it('should reject private keys without parameters p, q, dp, dq and qi.', () => {
    expect(
      () => new RSAKey({ kty: 'RSA', n: 'modulus', e: 'AQAB', d: 'private' })
    ).toThrow(InvalidKey)
  })

  it('should create a Private Key.', () => {
    const key = loadAsymmetricKey<RSAParams>('RSA', 'json', 'private')

    expect(new RSAKey(key)).toMatchObject({
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

describe('RSAKey getPublicKey()', () => {
  it('should return a valid public key.', () => {
    const jsonKey = loadAsymmetricKey<RSAParams>('RSA', 'json', 'public')
    const pemKey = loadAsymmetricKey('RSA', 'pem', 'public')

    expect(new RSAKey(jsonKey).getPublicKey()).toEqual(
      createPublicKey({ key: pemKey, format: 'pem', type: 'spki' })
    )
  })
})

describe('RSAKey getPrivateKey()', () => {
  it('should return a valid private key.', () => {
    const jsonKey = loadAsymmetricKey<RSAParams>('RSA', 'json', 'private')
    const pemKey = loadAsymmetricKey('RSA', 'pem', 'private')

    expect(new RSAKey(jsonKey).getPrivateKey()).toEqual(
      createPrivateKey({ key: pemKey, format: 'pem', type: 'pkcs1' })
    )
  })
})

describe('RSAKey export()', () => {
  const key = new RSAKey(loadAsymmetricKey<RSAParams>('RSA', 'json', 'private'))
  const publicKey = key.getPublicKey()
  const privateKey = key.getPrivateKey()

  it('should export a PKCS#1 Public Key.', () => {
    expect(key.export('pkcs1', 'public')).toEqual(
      publicKey.export({ format: 'pem', type: 'pkcs1' })
    )
  })

  it('should export an SPKI Public Key.', () => {
    expect(key.export('spki', 'public')).toEqual(
      publicKey.export({ format: 'pem', type: 'spki' })
    )
  })

  it('should export a PKCS#1 Private Key.', () => {
    expect(key.export('pkcs1', 'private')).toEqual(
      privateKey.export({ format: 'pem', type: 'pkcs1' })
    )
  })

  it('should export a PKCS#8 Private Key.', () => {
    expect(key.export('pkcs8', 'private')).toEqual(
      privateKey.export({ format: 'pem', type: 'pkcs8' })
    )
  })
})

describe('createRsaKey()', () => {
  it('should reject an invalid modulus length.', () => {
    expect(() => createRsaKey(undefined)).toThrow('Invalid modulus length.')
  })

  it('should reject a modulus length smaller than 2048 bits.', () => {
    expect(() => createRsaKey(2040)).toThrow(
      'The modulus MUST be AT LEAST 2048 bits long.'
    )
  })

  it('should create a new RSAKey.', () => {
    expect(createRsaKey(2048)).toEqual(
      expect.objectContaining({
        n: expect.any(String),
        e: expect.any(String),
        d: expect.any(String),
        p: expect.any(String),
        q: expect.any(String),
        dp: expect.any(String),
        dq: expect.any(String),
        qi: expect.any(String)
      })
    )
  })
})

describe('parseRsaKey()', () => {
  const publicJson = loadAsymmetricKey<RSAParams>('RSA', 'json', 'public')
  const privateJson = loadAsymmetricKey<RSAParams>('RSA', 'json', 'private')
  const publicPem = loadAsymmetricKey('RSA', 'pem', 'public')
  const privatePem = loadAsymmetricKey('RSA', 'pem', 'private')

  it('should reject an invalid PEM key data.', () => {
    expect(() => parseRsaKey(undefined, 'public')).toThrow(TypeError)
    expect(() => parseRsaKey('', 'private')).toThrow()
  })

  it('should create an RSAKey object.', () => {
    const { kty: pubKty, ...publicParams } = publicJson
    const { kty: privKty, ...privateParams } = privateJson

    expect(parseRsaKey(publicPem, 'public')).toEqual(publicParams)
    expect(parseRsaKey(privatePem, 'private')).toEqual(privateParams)
  })
})
