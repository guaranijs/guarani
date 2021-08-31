/* eslint-disable @typescript-eslint/no-unused-vars */

import { Dict } from '@guarani/utils'

import { JsonWebKey } from '../../lib/jwk'
import { SupportedHash } from '../../lib/types'

class MockKey extends JsonWebKey {
  public readonly kty: string

  public export(...params: any[]): string | Buffer {
    throw new Error('Method not implemented.')
  }

  public sign(
    message: Buffer,
    hash: SupportedHash,
    options?: Dict<any>
  ): Buffer {
    throw new Error('Method not implemented.')
  }

  public verify(
    signature: Buffer,
    message: Buffer,
    hash: SupportedHash,
    options?: Dict<any>
  ): void {
    throw new Error('Method not implemented.')
  }
}

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
