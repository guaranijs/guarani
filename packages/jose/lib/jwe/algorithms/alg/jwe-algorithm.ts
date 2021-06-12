import { Dict } from '@guarani/utils'

import { JsonWebKey } from '../../../jwk'
import { WrappedKey } from '../../_types'
import { JWEEncryption } from '../enc'

export abstract class JWEAlgorithm {
  public constructor(protected readonly algorithm: string) {}

  public abstract wrap(enc: JWEEncryption, key: JsonWebKey): Promise<WrappedKey>

  public abstract unwrap(
    enc: JWEEncryption,
    ek: Buffer,
    key: JsonWebKey,
    header?: Dict<any>
  ): Promise<Buffer>
}
