import { createPrivateKey } from 'crypto'

import {
  createEcKeyPair,
  ECPrivateKey,
  ECPrivateParams,
  exportEcPrivateKey,
  parseEcPrivateKey
} from '../../lib/jwk'

import { loadAsymmetricKey } from '../utils'

describe('ECPrivateKey constructor', () => {
  const key = loadAsymmetricKey<ECPrivateParams>('EC', 'json', 'private')

  it('should reject an invalid Private Value.', () => {
    const { d, ...params } = key

    expect(() => new ECPrivateKey({ d: undefined, ...params })).toThrow(
      'Invalid parameter "d".'
    )

    expect(() => new ECPrivateKey({ d: 'small', ...params })).toThrow(
      'The Private Value MUST have AT LEAST 32 bytes.'
    )
  })

  it('should create an Elliptic Curve Private Key.', () => {
    const key = loadAsymmetricKey<ECPrivateParams>('EC', 'json', 'private')

    expect(new ECPrivateKey(key)).toMatchObject({
      kty: 'EC',
      crv: key.crv,
      x: key.x,
      y: key.y,
      d: key.d
    })
  })
})

describe('ECPrivateKey privateKey', () => {
  it('should return a valid private key.', () => {
    const jsonKey = loadAsymmetricKey<ECPrivateParams>('EC', 'json', 'private')
    const pemKey = loadAsymmetricKey('EC', 'pem', 'private')

    expect(new ECPrivateKey(jsonKey).privateKey).toEqual(
      createPrivateKey({ key: pemKey, format: 'pem', type: 'sec1' })
    )
  })
})

describe('createEcKeyPair()', () => {
  it('should reject an invalid curve.', () => {
    expect(() => createEcKeyPair(undefined)).toThrow(
      'Unsupported curve "undefined".'
    )
  })

  it('should create a new Elliptic Curve Key Pair.', () => {
    const { publicKey, privateKey } = createEcKeyPair('P-256')

    expect(publicKey).toMatchObject({
      kty: 'EC',
      crv: 'P-256',
      x: expect.any(String),
      y: expect.any(String)
    })

    expect(privateKey).toMatchObject({
      kty: 'EC',
      crv: 'P-256',
      x: expect.any(String),
      y: expect.any(String),
      d: expect.any(String)
    })
  })
})

describe('parsEcPrivateKey()', () => {
  const json = loadAsymmetricKey<ECPrivateParams>('EC', 'json', 'private')
  const pem = loadAsymmetricKey('EC', 'pem', 'private')

  it('should reject an invalid PEM key data.', () => {
    expect(() => parseEcPrivateKey(undefined)).toThrow(TypeError)
  })

  it('should create an ECPrivateKey object.', () => {
    expect(parseEcPrivateKey(pem)).toMatchObject(json)
  })
})

describe('exportEcPrivateKey()', () => {
  const key = new ECPrivateKey(loadAsymmetricKey('EC', 'json', 'private'))
  const privateKey = key.privateKey

  it('should reject an invalid key.', () => {
    expect(() => exportEcPrivateKey(undefined, 'sec1')).toThrow(
      'Invalid parameter "key".'
    )
  })

  it('should export a SEC1 Elliptic Curve Private Key.', () => {
    expect(exportEcPrivateKey(key, 'sec1')).toEqual(
      privateKey.export({ format: 'pem', type: 'sec1' })
    )
  })

  it('should export a PKCS#8 Elliptic Curve Private Key.', () => {
    expect(exportEcPrivateKey(key, 'pkcs8')).toEqual(
      privateKey.export({ format: 'pem', type: 'pkcs8' })
    )
  })
})
