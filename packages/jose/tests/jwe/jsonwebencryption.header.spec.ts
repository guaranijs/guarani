import { JsonWebEncryptionHeader } from '../../lib/jwe'
import { JWE_ALGORITHMS, JWE_ENCRYPTIONS } from '../../lib/jwe/algorithms'

describe('JSON Web Encryption JOSE Header', () => {
  it('should reject an invalid Key Wrapping Algorithm.', () => {
    expect(
      () => new JsonWebEncryptionHeader({ alg: undefined, enc: 'A128GCM' })
    ).toThrow('Missing required parameter "alg".')

    expect(
      // @ts-expect-error
      () => new JsonWebEncryptionHeader({ alg: '', enc: 'A128GCM' })
    ).toThrow('Missing required parameter "alg".')

    expect(
      // @ts-expect-error
      () => new JsonWebEncryptionHeader({ alg: 123, enc: 'A128GCM' })
    ).toThrow('Invalid parameter "alg".')
  })

  it('should reject an invalid Content Encryption Algorithm.', () => {
    expect(
      () => new JsonWebEncryptionHeader({ alg: 'A128KW', enc: undefined })
    ).toThrow('Missing required parameter "enc".')

    expect(
      // @ts-expect-error
      () => new JsonWebEncryptionHeader({ alg: 'A128KW', enc: '' })
    ).toThrow('Missing required parameter "enc".')

    expect(
      // @ts-expect-error
      () => new JsonWebEncryptionHeader({ alg: 'A128KW', enc: 123 })
    ).toThrow('Invalid parameter "enc".')
  })

  it('should reject an unsupported algorithm.', () => {
    expect(
      () =>
        new JsonWebEncryptionHeader({
          // @ts-expect-error
          alg: 'unsupported-algorithm',
          enc: 'A128GCM'
        })
    ).toThrow('Invalid JSON Web Signature Algorithm.')
  })

  expect(
    () =>
      new JsonWebEncryptionHeader({
        alg: 'A128KW',
        // @ts-expect-error
        enc: 'unsupported-algorithm'
      })
  ).toThrow('Invalid JSON Web Signature Algorithm.')

  it('should reject an invalid "kid".', () => {
    expect(
      () =>
        // @ts-expect-error
        new JsonWebEncryptionHeader({ alg: 'dir', enc: 'A128GCM', kid: 123 })
    ).toThrow('Invalid parameter "kid".')
  })

  it('should reject an invalid "crit".', () => {
    expect(
      // @ts-expect-error
      () => new JsonWebEncryptionHeader({ alg: 'none', crit: 123 })
    ).toThrow('Invalid parameter "crit".')

    expect(
      () =>
        new JsonWebEncryptionHeader({ alg: 'dir', enc: 'A128GCM', crit: [] })
    ).toThrow('Invalid parameter "crit".')

    expect(
      () =>
        new JsonWebEncryptionHeader({
          alg: 'dir',
          enc: 'A128GCM',
          crit: ['kid', null]
        })
    ).toThrow('Invalid parameter "crit".')

    expect(
      () =>
        new JsonWebEncryptionHeader({
          alg: 'dir',
          enc: 'A128GCM',
          // @ts-expect-error
          crit: ['kid', 123]
        })
    ).toThrow('Invalid parameter "crit".')

    expect(
      () =>
        new JsonWebEncryptionHeader({
          alg: 'dir',
          enc: 'A128GCM',
          crit: ['kid']
        })
    ).toThrow('Missing required parameter "kid".')
  })

  it('should create a JOSE Header.', () => {
    expect(
      new JsonWebEncryptionHeader({
        alg: 'A256KW',
        enc: 'A256GCM',
        kid: 'key-id'
      })
    ).toMatchObject({ alg: 'A256KW', enc: 'A256GCM', kid: 'key-id' })
  })

  it('should return a JWSAlgorithm.', () => {
    const header = new JsonWebEncryptionHeader({ alg: 'dir', enc: 'A128GCM' })

    expect(JWE_ALGORITHMS[header.alg]).toBe(JWE_ALGORITHMS.dir)
    expect(JWE_ENCRYPTIONS[header.enc]).toBe(JWE_ENCRYPTIONS.A128GCM)
  })
})
