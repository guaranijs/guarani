import { Null } from '../../../lib/decorators/null'
import { ObjectIdentifier } from '../../../lib/decorators/object-identifier'
import { Sequence } from '../../../lib/decorators/sequence'

@Sequence()
export class RsaPublicPkcs1Oid {
  @ObjectIdentifier()
  public readonly oid: string = '1.2.840.113549.1.1.1'

  @Null()
  public readonly nil: null = null
}
