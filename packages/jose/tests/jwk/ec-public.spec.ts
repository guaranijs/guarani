import { createPublicKey } from 'crypto'

import {
  ECPublicKey,
  ECPublicParams,
  exportEcPublicKey,
  parseEcPublicKey
} from '../../lib/jwk'

import { loadAsymmetricKey } from '../utils'

describe('ECPublicKey constructor', () => {
  const key = loadAsymmetricKey<ECPublicParams>('EC', 'json', 'public')

  it('should reject a wrong "kty".', () => {
    const { kty, ...params } = key

    expect(() => new ECPublicKey({ kty: 'wrong', ...params })).toThrow(
      'Invalid parameter "kty". Expected "EC", got "wrong".'
    )
  })

  it('should reject an unsupported curve.', () => {
    const { crv, ...params } = key

    expect(() => new ECPublicKey({ crv: undefined, ...params })).toThrow(
      'Unsupported curve "undefined".'
    )

    // @ts-expect-error
    expect(() => new ECPublicKey({ crv: 'unknown-curve', ...params })).toThrow(
      'Unsupported curve "unknown-curve".'
    )
  })

  it('should reject an invalid X coordinate.', () => {
    const { x, ...params } = key

    expect(() => new ECPublicKey({ x: undefined, ...params })).toThrow(
      'Invalid parameter "x".'
    )
  })

  it('should reject an invalid Y coordinate.', () => {
    const { y, ...params } = key

    expect(() => new ECPublicKey({ y: undefined, ...params })).toThrow(
      'Invalid parameter "y".'
    )
  })

  it('should create an Elliptic Curve Public Key.', () => {
    const key = loadAsymmetricKey<ECPublicParams>('EC', 'json', 'public')

    expect(new ECPublicKey(key)).toMatchObject({
      kty: 'EC',
      crv: key.crv,
      x: key.x,
      y: key.y
    })
  })
})

describe('ECPublicKey publicKey', () => {
  it('should return a valid public key.', () => {
    const jsonKey = loadAsymmetricKey<ECPublicParams>('EC', 'json', 'public')
    const pemKey = loadAsymmetricKey('EC', 'pem', 'public')

    expect(new ECPublicKey(jsonKey).publicKey).toEqual(
      createPublicKey({ key: pemKey, format: 'pem', type: 'spki' })
    )
  })
})

describe('parseEcPublicKey()', () => {
  const json = loadAsymmetricKey<ECPublicParams>('EC', 'json', 'public')
  const pem = loadAsymmetricKey('EC', 'pem', 'public')

  it('should reject an invalid PEM key data.', () => {
    expect(() => parseEcPublicKey(undefined)).toThrow(TypeError)
  })

  it('should create an ECPublicKey object.', () => {
    expect(parseEcPublicKey(pem)).toMatchObject(json)
  })
})

describe('exportEcPublicKey()', () => {
  const key = new ECPublicKey(loadAsymmetricKey('EC', 'json', 'public'))
  const publicKey = key.publicKey

  it('should reject an invalid key.', () => {
    expect(() => exportEcPublicKey(undefined)).toThrow(
      'Invalid parameter "key".'
    )
  })

  it('should export an SPKI Elliptic Curve Public Key.', () => {
    expect(exportEcPublicKey(key)).toEqual(
      publicKey.export({ format: 'pem', type: 'spki' })
    )
  })
})
