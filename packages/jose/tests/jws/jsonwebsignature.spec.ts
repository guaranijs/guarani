import { base64UrlEncode } from '@guarani/utils'

import {
  InvalidJoseHeader,
  InvalidJsonWebSignature
} from '../../lib/exceptions'
import { OctKey } from '../../lib/jwk'
import { JsonWebSignature, JsonWebSignatureHeader } from '../../lib/jws'
import { JWSFlattenedSerialization } from '../../lib/jws/_types'
import { loadSymmetricKey } from '../utils'

const key = new OctKey(loadSymmetricKey('oct', 'json'))
const header = new JsonWebSignatureHeader({ alg: 'HS256' })
const jsonHeader = new JsonWebSignatureHeader({
  protectedHeader: header,
  unprotectedHeader: { typ: 'JWT' }
})
const payload = Buffer.from('{"iat": 1723010455, "sub": "078BWDDXasdcg8"}')

const token =
  'eyJhbGciOiJIUzI1NiJ9.' +
  'eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0.' +
  'hRqmKz7sKWQZyNM1Kw9AgqPNOedszPvEADYmNFo8foA'

// TODO: Add tests for multiple headers.
describe('JSON Web Signature constructor', () => {
  it('should reject an invalid header.', () => {
    // @ts-expect-error
    expect(() => new JsonWebSignature({}, payload)).toThrow(InvalidJoseHeader)
  })

  it('should reject an invalid payload.', () => {
    expect(
      // @ts-expect-error
      () => new JsonWebSignature(header, { sub: 'user-id' })
    ).toThrow('The provided payload is invalid.')
  })

  it('should create an instance of a JSON Web Signature.', () => {
    expect(() => new JsonWebSignature(header, payload)).not.toThrow()

    expect(() => new JsonWebSignature(jsonHeader, payload)).not.toThrow()
  })
})

describe('JSON Web Signature serializeCompact()', () => {
  const jws = new JsonWebSignature(header, payload)

  it('should reject an invalid header.', async () => {
    await expect(
      new JsonWebSignature([]).serializeCompact(key)
    ).rejects.toThrow(
      'This JSON Web Signature cannot be serialized ' +
        'using the JWS Compact Serialization.'
    )
  })

  it('should reject an invalid key.', async () => {
    // Only works because the alg is not "none".
    await expect(jws.serializeCompact()).rejects.toThrow(
      'The algorithm "HS256" requires the use of a JSON Web Key.'
    )
  })

  it('should encode a JOSE Header and a Payload into a JWS Compact Token.', async () => {
    await expect(jws.serializeCompact(key)).resolves.toEqual(token)
  })
})

describe('JSON Web Signature deserializeCompact()', () => {
  it('should reject an invalid token.', async () => {
    await expect(
      // @ts-ignore
      JsonWebSignature.deserializeCompact(123, key)
    ).rejects.toThrow('The provided JSON Web Signature is invalid.')
  })

  it('should reject a malformed token.', async () => {
    await expect(JsonWebSignature.deserializeCompact('', key)).rejects.toThrow(
      InvalidJsonWebSignature
    )

    await expect(
      JsonWebSignature.deserializeCompact('aaa.bbb', key)
    ).rejects.toThrow(InvalidJsonWebSignature)

    await expect(
      JsonWebSignature.deserializeCompact('aaa.bbb.ccc', key)
    ).rejects.toThrow(InvalidJsonWebSignature)
  })

  it('should reject an invalid JSON Web Key.', async () => {
    await expect(
      // @ts-expect-error
      JsonWebSignature.deserializeCompact(token, 123)
    ).rejects.toThrow('Invalid key.')
  })

  it('should reject conflicting algorithms.', async () => {
    await expect(
      JsonWebSignature.deserializeCompact(token, key, 'none')
    ).rejects.toThrow(
      'The algorithm used to sign this token is invalid. ' +
        'Expected "none", got "HS256".'
    )
  })

  it('should not verify the signature when asked so.', async () => {
    expect(
      JsonWebSignature.decodeCompact(
        'eyJhbGciOiJIUzI1NiJ9.' +
          'eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0.'
      )
    ).toEqual([header, payload])
  })

  it('should validate and decode the JSON Web Signature Token.', async () => {
    await expect(
      JsonWebSignature.deserializeCompact(token, key, 'HS256')
    ).resolves.toMatchObject({
      header,
      payload
    })
  })
})

describe('JSON Web Signature serializeFlattened()', () => {
  const jws = new JsonWebSignature(jsonHeader, payload)

  it('should reject an invalid header.', async () => {
    await expect(
      new JsonWebSignature([]).serializeFlattened(key)
    ).rejects.toThrow(
      'This JSON Web Signature cannot be serialized ' +
        'using the JWS Flattened Serialization.'
    )
  })

  it('should reject an invalid key.', async () => {
    // Only works because the alg is not "none".
    await expect(jws.serializeFlattened()).rejects.toThrow(
      'The algorithm "HS256" requires the use of a JSON Web Key.'
    )
  })

  it('should encode a JOSE Header and a Payload into a JWS Flattened Token.', async () => {
    await expect(
      jws.serializeFlattened(key)
    ).resolves.toMatchObject<JWSFlattenedSerialization>({
      payload: base64UrlEncode(payload),
      signature: expect.any(String),
      header: jsonHeader.unprotectedHeader,
      protected: base64UrlEncode(
        Buffer.from(JSON.stringify(jsonHeader.protectedHeader))
      )
    })
  })
})

// TODO: Add test deserializeFlattened()
// TODO: Add test serialieJSON()
// TODO: Add test deserializeJSON()
