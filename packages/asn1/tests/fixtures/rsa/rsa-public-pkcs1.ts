import { Dict, Optional } from '@guarani/types'

import { Integer } from '../../../lib/decorators/integer'
import { Sequence } from '../../../lib/decorators/sequence'

@Sequence()
export class RsaPublicPkcs1 {
  @Integer()
  public readonly n!: bigint

  @Integer()
  public readonly e!: bigint

  public constructor(params?: Optional<Dict<bigint>>) {
    if (typeof params !== 'undefined') {
      this.n = params.n
      this.e = params.e
    }
  }
}
