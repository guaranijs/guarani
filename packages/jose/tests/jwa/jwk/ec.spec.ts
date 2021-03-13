import { createPrivateKey, createPublicKey } from 'crypto'

import { createEcKey, ECKey, ECParams, parseEcKey } from '../../../lib'
import { loadAsymmetricKey } from '../../utils'

describe('ECKey constructor', () => {
  it('should reject a wrong "kty".', () => {
    expect(
      () =>
        new ECKey({
          kty: 'wrong',
          crv: 'P-256',
          x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
          y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8'
        })
    ).toThrow('Invalid parameter "kty". Expected "EC", got "wrong".')
  })

  it('should reject an unsupported curve.', () => {
    expect(
      () =>
        new ECKey({
          kty: 'EC',
          crv: undefined,
          x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
          y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8'
        })
    ).toThrow('Unsupported curve "undefined".')

    expect(
      () =>
        new ECKey({
          kty: 'EC',
          // @ts-expect-error
          crv: 'unknown-curve',
          x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
          y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8'
        })
    ).toThrow('Unsupported curve "unknown-curve".')
  })

  it('should reject keys without "x" or "y".', () => {
    expect(
      () =>
        new ECKey({
          kty: 'EC',
          crv: 'P-256',
          x: undefined,
          y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8'
        })
    ).toThrow('Invalid parameter "x".')

    expect(
      () =>
        new ECKey({
          kty: 'EC',
          crv: 'P-256',
          x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
          y: undefined
        })
    ).toThrow('Invalid parameter "y".')
  })

  it('should create a Public Key.', () => {
    const key = loadAsymmetricKey<ECParams>('EC', 'json', 'public')
    expect(new ECKey(key)).toMatchObject({ crv: 'P-256', x: key.x, y: key.y })
  })

  it('should reject private keys with an invalid parameter "d".', () => {
    expect(
      () =>
        new ECKey({
          kty: 'EC',
          crv: 'P-256',
          x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
          y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
          // @ts-expect-error
          d: 123
        })
    ).toThrow('Invalid parameter "d".')
  })

  it('should create a Private Key.', () => {
    const key = loadAsymmetricKey<ECParams>('EC', 'json', 'private')

    expect(new ECKey(key)).toMatchObject({
      crv: key.crv,
      x: key.x,
      y: key.y,
      d: key.d
    })
  })
})

describe('ECKey getPublicKey()', () => {
  it('should return a valid public key.', () => {
    const jsonKey = loadAsymmetricKey<ECParams>('EC', 'json', 'public')
    const pemKey = loadAsymmetricKey('EC', 'pem', 'public')

    expect(new ECKey(jsonKey).getPublicKey()).toEqual(
      createPublicKey({ key: pemKey, format: 'pem', type: 'spki' })
    )
  })
})

describe('ECKey getPrivateKey()', () => {
  it('should return a valid private key.', () => {
    const jsonKey = loadAsymmetricKey<ECParams>('EC', 'json', 'private')
    const pemKey = loadAsymmetricKey('EC', 'pem', 'private')

    expect(new ECKey(jsonKey).getPrivateKey()).toEqual(
      createPrivateKey({ key: pemKey, format: 'pem', type: 'sec1' })
    )
  })
})

describe('ECKey export()', () => {
  const key = new ECKey(loadAsymmetricKey<ECParams>('EC', 'json', 'private'))
  const publicKey = key.getPublicKey()
  const privateKey = key.getPrivateKey()

  it('should export an SPKI Public Key.', () => {
    expect(key.export('spki', 'public')).toEqual(
      publicKey.export({ format: 'pem', type: 'spki' })
    )
  })

  it('should export a SEC1 Private Key.', () => {
    expect(key.export('sec1', 'private')).toEqual(
      privateKey.export({ format: 'pem', type: 'sec1' })
    )
  })

  it('should export a PKCS#8 Private Key.', () => {
    expect(key.export('pkcs8', 'private')).toEqual(
      privateKey.export({ format: 'pem', type: 'pkcs8' })
    )
  })
})

describe('createEcKey()', () => {
  it('should reject invalid curves.', () => {
    expect(() => createEcKey(undefined)).toThrow(
      'Unsupported curve "undefined".'
    )
  })

  it('should create a new ECKey.', () => {
    expect(createEcKey('P-256')).toEqual(
      expect.objectContaining({
        crv: 'P-256',
        x: expect.any(String),
        y: expect.any(String),
        d: expect.any(String)
      })
    )
  })
})

describe('parseEcKey()', () => {
  const publicJson = loadAsymmetricKey<ECParams>('EC', 'json', 'public')
  const privateJson = loadAsymmetricKey<ECParams>('EC', 'json', 'private')
  const publicPem = loadAsymmetricKey('EC', 'pem', 'public')
  const privatePem = loadAsymmetricKey('EC', 'pem', 'private')

  it('should reject an invalid PEM key data.', () => {
    expect(() => parseEcKey(undefined, 'public')).toThrow(TypeError)
    expect(() => parseEcKey('', 'private')).toThrow()
  })

  it('should create an ECKey object.', () => {
    const { kty: pubKty, ...publicParams } = publicJson
    const { kty: privKty, ...privateParams } = privateJson

    expect(parseEcKey(publicPem, 'public')).toEqual(publicParams)
    expect(parseEcKey(privatePem, 'private')).toEqual(privateParams)
  })
})
