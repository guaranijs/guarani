import { MockKey } from './key.mock'

describe('JsonWebKey constructor', () => {
  it('should reject an invalid "use".', () => {
    // @ts-expect-error
    expect(() => new MockKey({ use: 123 })).toThrow('Invalid parameter "use".')
  })

  it('should reject an invalid "key_ops".', () => {
    // @ts-expect-error
    expect(() => new MockKey({ key_ops: 123 })).toThrow(
      'Invalid parameter "key_ops".'
    )

    expect(() => new MockKey({ key_ops: ['sign', 'sign', 'verify'] })).toThrow(
      'Parameter "key_ops" cannot have repeated operations.'
    )

    expect(() => new MockKey({ use: 'sig', key_ops: ['encrypt'] })).toThrow(
      'Invalid combination of "use" and "key_ops".'
    )

    expect(() => new MockKey({ use: 'enc', key_ops: ['verify'] })).toThrow(
      'Invalid combination of "use" and "key_ops".'
    )
  })

  it('should reject an invalid "alg".', () => {
    // @ts-expect-error
    expect(() => new MockKey({ alg: 123 })).toThrow('Invalid parameter "alg".')
  })

  it('should reject an invalid "kid".', () => {
    // @ts-expect-error
    expect(() => new MockKey({ kid: 123 })).toThrow('Invalid parameter "kid".')
  })
})
