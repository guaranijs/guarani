/* eslint-disable @typescript-eslint/no-unused-vars */

import { Dict } from '@guarani/types'

import { JsonWebKey } from '../../../lib/jwk'
import { SupportedHash } from '../../../lib/types'

export class MockKey extends JsonWebKey {
  public readonly kty!: string

  public export(...params: any[]): string | Buffer {
    throw new Error('Method not implemented.')
  }

  public sign(message: Buffer, hash: SupportedHash, options?: Dict): Buffer {
    throw new Error('Method not implemented.')
  }

  public verify(
    signature: Buffer,
    message: Buffer,
    hash: SupportedHash,
    options?: Dict
  ): void {
    throw new Error('Method not implemented.')
  }
}
