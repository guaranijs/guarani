import { Integer, Sequence } from '@guarani/asn1'
import { decode } from '@guarani/base64url'
import { Optional } from '@guarani/types'

interface PrivatePkcs1Params {
  readonly n: string
  readonly e: string
  readonly d: string
  readonly p: string
  readonly q: string
  readonly dp: string
  readonly dq: string
  readonly qi: string
}

@Sequence()
export class PrivatePkcs1 {
  @Integer()
  public readonly version: bigint = 0x00n

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

  public constructor(params?: Optional<PrivatePkcs1Params>) {
    if (typeof params !== 'undefined') {
      this.n = decode(params.n, BigInt)
      this.e = decode(params.e, BigInt)
      this.d = decode(params.d, BigInt)
      this.p = decode(params.p, BigInt)
      this.q = decode(params.q, BigInt)
      this.dp = decode(params.dp, BigInt)
      this.dq = decode(params.dq, BigInt)
      this.qi = decode(params.qi, BigInt)
    }
  }
}
