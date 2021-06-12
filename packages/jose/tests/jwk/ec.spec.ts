import { createPrivateKey, createPublicKey } from 'crypto'

import { EcKey, EcKeyParams } from '../../lib/jwk/algorithms'
import { loadAsymmetricKey } from '../utils'

describe('Elliptic Curve Public Key', () => {
  const key = loadAsymmetricKey<EcKeyParams>('EC', 'json', 'public')

  it('should reject a wrong "kty".', () => {
    const { kty, ...params } = key

    expect(() => new EcKey({ kty: 'wrong', ...params })).toThrow(
      'Invalid parameter "kty". Expected "EC", got "wrong".'
    )
  })

  it('should reject an unsupported curve.', () => {
    const { crv, ...params } = key

    expect(() => new EcKey({ crv: undefined, ...params })).toThrow(
      'Unsupported curve "undefined".'
    )

    // @ts-expect-error
    expect(() => new EcKey({ crv: 'unknown-curve', ...params })).toThrow(
      'Unsupported curve "unknown-curve".'
    )
  })

  it('should reject an invalid X coordinate.', () => {
    const { x, ...params } = key

    expect(() => new EcKey({ x: undefined, ...params })).toThrow(
      'Invalid parameter "x".'
    )

    // @ts-expect-error
    expect(() => new EcKey({ x: 123, ...params })).toThrow(
      'Invalid parameter "x".'
    )
  })

  it('should reject an invalid Y coordinate.', () => {
    const { y, ...params } = key

    expect(() => new EcKey({ y: undefined, ...params })).toThrow(
      'Invalid parameter "y".'
    )

    // @ts-expect-error
    expect(() => new EcKey({ y: 123, ...params })).toThrow(
      'Invalid parameter "y".'
    )
  })

  it('should create an Elliptic Curve Public Key.', () => {
    const key = loadAsymmetricKey<EcKeyParams>('EC', 'json', 'public')

    expect(new EcKey(key)).toMatchObject({
      kty: 'EC',
      crv: key.crv,
      x: key.x,
      y: key.y
    })
  })
})

describe('Elliptic Curve Private Key', () => {
  const key = loadAsymmetricKey<EcKeyParams>('EC', 'json', 'private')

  it('should reject keys with a wrong parameter "d".', () => {
    const { d, ...params } = key

    // @ts-expect-error
    expect(() => new EcKey({ d: 123, ...params })).toThrow(
      'Invalid parameter "d".'
    )
  })

  it('should create an Elliptic Curve Private Key.', () => {
    const key = loadAsymmetricKey<EcKeyParams>('EC', 'json', 'private')

    expect(new EcKey(key)).toMatchObject({
      kty: 'EC',
      crv: key.crv,
      x: key.x,
      y: key.y,
      d: key.d
    })
  })
})

describe('EcKey generate()', () => {
  it('should reject an invalid curve.', async () => {
    await expect(EcKey.generate(undefined)).rejects.toThrow(
      'Unsupported curve "undefined".'
    )

    // @ts-expect-error
    await expect(EcKey.generate('unknown-curve')).rejects.toThrow(
      'Unsupported curve "unknown-curve".'
    )
  })

  it('should create a new EcKey.', async () => {
    const key = await EcKey.generate('P-256')

    expect(key).toMatchObject({
      kty: 'EC',
      crv: 'P-256',
      x: expect.any(String),
      y: expect.any(String),
      d: expect.any(String)
    })
  })
})

describe('EcKey parse()', () => {
  const publicJson = loadAsymmetricKey<EcKeyParams>('EC', 'json', 'public')
  const publicPem = loadAsymmetricKey('EC', 'pem', 'public')

  const privateJson = loadAsymmetricKey<EcKeyParams>('EC', 'json', 'private')
  const privatePem = loadAsymmetricKey('EC', 'pem', 'private')

  it('should reject an invalid PEM key data.', () => {
    expect(() => EcKey.parse(undefined)).toThrow(TypeError)

    // @ts-expect-error
    expect(() => EcKey.parse(123)).toThrow(TypeError)

    expect(() => EcKey.parse('')).toThrow(TypeError)
  })

  it('should create an Elliptic Curve Public Key.', () => {
    expect(EcKey.parse(publicPem)).toMatchObject(publicJson)
  })

  it('should create an Elliptic Curve Private Key.', () => {
    expect(EcKey.parse(privatePem)).toMatchObject(privateJson)
  })
})

describe('EcKey export()', () => {
  const key = new EcKey(loadAsymmetricKey('EC', 'json', 'private'))

  const publicPem = loadAsymmetricKey('EC', 'pem', 'public')
  const privatePem = loadAsymmetricKey('EC', 'pem', 'private')

  const publicKey = createPublicKey(publicPem)
  const privateKey = createPrivateKey(privatePem)

  it('should reject an invalid key.', () => {
    // @ts-expect-error
    expect(() => key.export('invalid', 'pem', 'sec1')).toThrow(
      'Invalid parameter "key".'
    )
  })

  it('should reject an invalid private key type.', () => {
    // @ts-expect-error
    expect(() => key.export('private', 'pem', 'x509')).toThrow(
      'Invalid parameter "type".'
    )
  })

  it('should export a DER X.509 SubjectPublicKeyInfo Elliptic Curve Public Key.', () => {
    expect(key.export('public', 'der')).toEqual(
      publicKey.export({ format: 'der', type: 'spki' })
    )
  })

  it('should export a PEM X.509 SubjectPublicKeyInfo Elliptic Curve Public Key.', () => {
    expect(key.export('public', 'pem')).toEqual(
      publicKey.export({ format: 'pem', type: 'spki' })
    )
  })

  it('should export a DER SEC.1 Elliptic Curve Private Key.', () => {
    expect(key.export('private', 'der', 'sec1')).toEqual(
      privateKey.export({ format: 'der', type: 'sec1' })
    )
  })

  it('should export a PEM SEC.1 Elliptic Curve Private Key.', () => {
    expect(key.export('private', 'pem', 'sec1')).toEqual(
      privateKey.export({ format: 'pem', type: 'sec1' })
    )
  })

  it('should export a DER PKCS#8 Elliptic Curve Private Key.', () => {
    expect(key.export('private', 'der', 'pkcs8')).toEqual(
      privateKey.export({ format: 'der', type: 'pkcs8' })
    )
  })

  it('should export a PEM PKCS#8 Elliptic Curve Private Key.', () => {
    expect(key.export('private', 'pem', 'pkcs8')).toEqual(
      privateKey.export({ format: 'pem', type: 'pkcs8' })
    )
  })
})
