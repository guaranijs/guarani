import { Integer, Sequence } from '@guarani/asn1'
import { decode } from '@guarani/base64url'
import { Optional } from '@guarani/types'

interface PublicPkcs1Params {
  readonly n: string
  readonly e: string
}

@Sequence()
export class PublicPkcs1 {
  @Integer()
  public readonly n!: bigint

  @Integer()
  public readonly e!: bigint

  public constructor(params?: Optional<PublicPkcs1Params>) {
    if (typeof params !== 'undefined') {
      this.n = decode(params.n, BigInt)
      this.e = decode(params.e, BigInt)
    }
  }
}
