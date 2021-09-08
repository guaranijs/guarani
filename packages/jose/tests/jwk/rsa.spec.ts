/* eslint-disable @typescript-eslint/no-unused-vars */

import { createPrivateKey, createPublicKey } from 'crypto'

import { RsaKey, RsaKeyParams } from '../../lib/jwk/algorithms'
import { loadAsymmetricKey } from '../utils'

describe('RSA Public Key', () => {
  const key = loadAsymmetricKey<RsaKeyParams>('RSA', 'json', 'public')

  it('should reject a wrong "kty".', () => {
    const { kty, ...params } = key

    // @ts-expect-error
    expect(() => new RsaKey({ kty: 'wrong', ...params })).toThrow(
      'Invalid parameter "kty". Expected "RSA", got "wrong".'
    )
  })

  it('should reject keys with a wrong parameter "n".', () => {
    const { n, ...params } = key

    expect(() => new RsaKey({ n: undefined, ...params })).toThrow(
      'Invalid parameter "n".'
    )

    // @ts-expect-error
    expect(() => new RsaKey({ n: 123, ...params })).toThrow(
      'Invalid parameter "n".'
    )

    expect(() => new RsaKey({ n: 'modulus', ...params })).toThrow(
      'The modulus MUST have AT LEAST 2048 bits.'
    )
  })

  it('should reject keys with a wrong parameter "e".', () => {
    const { e, ...params } = key

    expect(() => new RsaKey({ e: undefined, ...params })).toThrow(
      'Invalid parameter "e".'
    )

    // @ts-expect-error
    expect(() => new RsaKey({ e: 123, ...params })).toThrow(
      'Invalid parameter "e".'
    )
  })

  it('should create an RSA Public Key.', () => {
    expect(new RsaKey(key)).toMatchObject<RsaKeyParams>({
      kty: 'RSA',
      n: key.n,
      e: key.e
    })
  })
})

describe('RSA Private Key', () => {
  const key = loadAsymmetricKey<RsaKeyParams>('RSA', 'json', 'private')

  it('should reject keys with a wrong parameter "d".', () => {
    const { d, ...params } = key

    // @ts-expect-error
    expect(() => new RsaKey({ d: 123, ...params })).toThrow(
      'Invalid parameter "d".'
    )
  })

  it('should reject keys with a wrong parameter "p".', () => {
    const { p, ...params } = key

    expect(() => new RsaKey({ p: undefined, ...params })).toThrow(
      'Invalid parameter "p".'
    )

    // @ts-expect-error
    expect(() => new RsaKey({ p: 123, ...params })).toThrow(
      'Invalid parameter "p".'
    )
  })

  it('should reject keys with a wrong parameter "q".', () => {
    const { q, ...params } = key

    expect(() => new RsaKey({ q: undefined, ...params })).toThrow(
      'Invalid parameter "q".'
    )

    // @ts-expect-error
    expect(() => new RsaKey({ q: 123, ...params })).toThrow(
      'Invalid parameter "q".'
    )
  })

  it('should reject keys with a wrong parameter "dp".', () => {
    const { dp, ...params } = key

    expect(() => new RsaKey({ dp: undefined, ...params })).toThrow(
      'Invalid parameter "dp".'
    )

    // @ts-expect-error
    expect(() => new RsaKey({ dp: 123, ...params })).toThrow(
      'Invalid parameter "dp".'
    )
  })

  it('should reject keys with a wrong parameter "dq".', () => {
    const { dq, ...params } = key

    expect(() => new RsaKey({ dq: undefined, ...params })).toThrow(
      'Invalid parameter "dq".'
    )

    // @ts-expect-error
    expect(() => new RsaKey({ dq: 123, ...params })).toThrow(
      'Invalid parameter "dq".'
    )
  })

  it('should reject keys with a wrong parameter "qi".', () => {
    const { qi, ...params } = key

    expect(() => new RsaKey({ qi: undefined, ...params })).toThrow(
      'Invalid parameter "qi".'
    )

    // @ts-expect-error
    expect(() => new RsaKey({ qi: 123, ...params })).toThrow(
      'Invalid parameter "qi".'
    )
  })

  it('should create an RSA Private Key.', () => {
    expect(new RsaKey(key)).toMatchObject<RsaKeyParams>({
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

describe('RsaKey generate()', () => {
  it('should reject an invalid modulus length.', async () => {
    await expect(RsaKey.generate(undefined)).rejects.toThrow(
      'Invalid modulus length.'
    )

    await expect(RsaKey.generate(2048.16)).rejects.toThrow(
      'Invalid modulus length.'
    )
  })

  it('should reject a modulus length smaller than 2048 bits.', async () => {
    await expect(RsaKey.generate(2047)).rejects.toThrow(
      'The modulus MUST be AT LEAST 2048 bits long.'
    )
  })

  it('should create a new RsaKey.', async () => {
    const key = await RsaKey.generate(2048)

    expect(key).toBeInstanceOf(RsaKey)
    expect(key).toMatchObject({
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

describe('RsaKey parse()', () => {
  const publicJson = loadAsymmetricKey<RsaKeyParams>('RSA', 'json', 'public')
  const publicPem = loadAsymmetricKey('RSA', 'pem', 'public')

  const privateJson = loadAsymmetricKey<RsaKeyParams>('RSA', 'json', 'private')
  const privatePem = loadAsymmetricKey('RSA', 'pem', 'private')

  it('should reject an invalid PEM key data.', () => {
    expect(() => RsaKey.parse(undefined)).toThrow(TypeError)

    // @ts-expect-error
    expect(() => RsaKey.parse(123)).toThrow(TypeError)

    expect(() => RsaKey.parse('')).toThrow(TypeError)
  })

  it('should create an RSA Public Key.', () => {
    expect(RsaKey.parse(publicPem)).toMatchObject(publicJson)
  })

  it('should create an RSA Private Key.', () => {
    expect(RsaKey.parse(privatePem)).toMatchObject(privateJson)
  })
})

describe('RsaKey export()', () => {
  const key = new RsaKey(loadAsymmetricKey('RSA', 'json', 'private'))

  const publicPem = loadAsymmetricKey('RSA', 'pem', 'public')
  const privatePem = loadAsymmetricKey('RSA', 'pem', 'private')

  const publicKey = createPublicKey(publicPem)
  const privateKey = createPrivateKey(privatePem)

  it('should reject an invalid key.', () => {
    // @ts-expect-error
    expect(() => key.export('invalid', 'pem', 'pkcs1')).toThrow(
      'Invalid parameter "key".'
    )
  })

  it('should reject an invalid public key type.', () => {
    // @ts-expect-error
    expect(() => key.export('public', 'pem', 'pkcs8')).toThrow(
      'Invalid parameter "type".'
    )
  })

  it('should reject an invalid private key type.', () => {
    // @ts-expect-error
    expect(() => key.export('private', 'pem', 'x509')).toThrow(
      'Invalid parameter "type".'
    )
  })

  it('should export a DER PKCS#1 RSA Public Key.', () => {
    expect(key.export('public', 'der', 'pkcs1')).toEqual(
      publicKey.export({ format: 'der', type: 'pkcs1' })
    )
  })

  it('should export a PEM PKCS#1 RSA Public Key.', () => {
    expect(key.export('public', 'pem', 'pkcs1')).toEqual(
      publicKey.export({ format: 'pem', type: 'pkcs1' })
    )
  })

  it('should export a DER X.509 SubjectPublicKeyInfo RSA Public Key.', () => {
    expect(key.export('public', 'der', 'x509')).toEqual(
      publicKey.export({ format: 'der', type: 'spki' })
    )
  })

  it('should export a PEM X.509 SubjectPublicKeyInfo RSA Public Key.', () => {
    expect(key.export('public', 'pem', 'x509')).toEqual(
      publicKey.export({ format: 'pem', type: 'spki' })
    )
  })

  it('should export a DER PKCS#1 RSA Private Key.', () => {
    expect(key.export('private', 'der', 'pkcs1')).toEqual(
      privateKey.export({ format: 'der', type: 'pkcs1' })
    )
  })

  it('should export a PEM PKCS#1 RSA Private Key.', () => {
    expect(key.export('private', 'pem', 'pkcs1')).toEqual(
      privateKey.export({ format: 'pem', type: 'pkcs1' })
    )
  })

  it('should export a DER PKCS#8 RSA Private Key.', () => {
    expect(key.export('private', 'der', 'pkcs8')).toEqual(
      privateKey.export({ format: 'der', type: 'pkcs8' })
    )
  })

  it('should export a PEM PKCS#8 RSA Private Key.', () => {
    expect(key.export('private', 'pem', 'pkcs8')).toEqual(
      privateKey.export({ format: 'pem', type: 'pkcs8' })
    )
  })
})
