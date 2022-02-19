import { Dict, Optional } from '@guarani/types'

import { Integer } from '../../../lib/decorators/integer'
import { Sequence } from '../../../lib/decorators/sequence'

@Sequence()
export class RsaPrivatePkcs1 {
  @Integer()
  public readonly version: bigint = 0x0n

  @Integer()
  public readonly n!: bigint

  @Integer()
  public readonly e!: bigint

  @Integer()
  public readonly d!: bigint

  @Integer()
  public readonly p!: bigint

  @Integer()
  public readonly q!: bigint

  @Integer()
  public readonly dp!: bigint

  @Integer()
  public readonly dq!: bigint

  @Integer()
  public readonly qi!: bigint

  public constructor(params?: Optional<Dict<bigint>>) {
    if (typeof params !== 'undefined') {
      this.n = params.n
      this.e = params.e
      this.d = params.d
      this.p = params.p
      this.q = params.q
      this.dp = params.dp
      this.dq = params.dq
      this.qi = params.qi
    }
  }
}

const key = new RsaPrivatePkcs1()
