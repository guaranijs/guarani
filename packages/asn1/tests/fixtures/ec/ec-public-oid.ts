import { ObjectId } from '../../../lib/decorators/objectid'
import { Sequence } from '../../../lib/decorators/sequence'

@Sequence()
export class EcPublicOid {
  @ObjectId()
  public readonly oid: string = '1.2.840.10045.2.1'

  @ObjectId()
  public readonly curveOid: string = '1.2.840.10045.3.1.7'
}
