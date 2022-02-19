import { Integer } from '../../../lib/decorators/integer'
import { Sequence } from '../../../lib/decorators/sequence'

@Sequence()
export class RsaPublicPkcs1 {
  @Integer()
  public readonly n!: bigint

  @Integer()
  public readonly e!: bigint
}
