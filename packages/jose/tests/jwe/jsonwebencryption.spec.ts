import {
  InvalidJoseHeader,
  InvalidJsonWebEncryption
} from '../../lib/exceptions'
import { JsonWebEncryption, JsonWebEncryptionHeader } from '../../lib/jwe'
import { OctKey } from '../../lib/jwk'

const protectedHeader = new JsonWebEncryptionHeader({
  alg: 'A128KW',
  enc: 'A128CBC-HS256'
})

const plaintext = Buffer.from('Live long and prosper.')
const wrapKey = new OctKey({ k: 'GawgguFyGrWKav7AX4VKUg' })

const token =
  'eyJhbGciOiJBMTI4S1ciLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0.' +
  '6KB707dM9YTIgHtLvtgWQ8mKwboJW3of9locizkDTHzBC2IlrT1oOQ.' +
  'AxY8DCtDaGlsbGljb3RoZQ.' +
  'KDlTtXchhZTGufMYmOYGS4HffxPSUrfmqCHXaI9wOGY.' +
  'U0m_YmjN04DJvceFICbCVQ'

describe('JSON Web Encryption constructor', () => {
  it('should reject an invalid header.', () => {
    // @ts-expect-error
    expect(() => new JsonWebEncryption({}, plaintext)).toThrow(
      InvalidJoseHeader
    )
  })

  it('should reject an invalid payload.', () => {
    expect(
      // @ts-expect-error
      () => new JsonWebEncryption(protectedHeader, { sub: 'user-id' })
    ).toThrow('The provided plaintext is invalid.')
  })

  it('should create an instance of a JSON Web Encryption.', () => {
    expect(
      () => new JsonWebEncryption(protectedHeader, plaintext)
    ).not.toThrow()
  })
})

describe('JSON Web Encryption serializeCompact()', () => {
  const jwe = new JsonWebEncryption(protectedHeader, plaintext)

  it('should reject an invalid key.', async () => {
    await expect(jwe.serializeCompact()).rejects.toThrow(
      'The algorithm "A128KW" requires the use of a JSON Web Key.'
    )
  })

  it('should encode a JOSE Header and a Plaintext into a JWE Compact Token.', async () => {
    const token = await jwe.serializeCompact(wrapKey)

    expect(token.split('.').length).toBe(5)
  })
})

describe('JSON Web Encryption deserializeCompact()', () => {
  it('should reject an invalid token.', async () => {
    await expect(
      // @ts-ignore
      JsonWebEncryption.deserializeCompact(123, wrapKey)
    ).rejects.toThrow(InvalidJsonWebEncryption)
  })

  it('should reject a malformed token.', async () => {
    await expect(
      JsonWebEncryption.deserializeCompact('', wrapKey)
    ).rejects.toThrow(InvalidJsonWebEncryption)

    await expect(
      JsonWebEncryption.deserializeCompact('aaa.bbb', wrapKey)
    ).rejects.toThrow(InvalidJsonWebEncryption)

    await expect(
      JsonWebEncryption.deserializeCompact('aaa.bbb.ccc.ddd.eee', wrapKey)
    ).rejects.toThrow(InvalidJsonWebEncryption)
  })

  it('should reject an invalid JSON Web Key.', async () => {
    await expect(
      // @ts-expect-error
      JsonWebEncryption.deserializeCompact(token, 123)
    ).rejects.toThrow('Invalid key.')
  })

  it('should validate and decode the JSON Web Signature Token.', async () => {
    await expect(
      JsonWebEncryption.deserializeCompact(token, wrapKey)
    ).resolves.toMatchObject({
      header: protectedHeader,
      plaintext
    })
  })
})
