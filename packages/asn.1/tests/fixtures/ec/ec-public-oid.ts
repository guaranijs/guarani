import { ObjectIdentifier } from '../../../lib/decorators/object-identifier'
import { Sequence } from '../../../lib/decorators/sequence'

@Sequence()
export class EcPublicOid {
  @ObjectIdentifier()
  public readonly oid: string = '1.2.840.10045.2.1'

  @ObjectIdentifier()
  public readonly curveOid: string = '1.2.840.10045.3.1.7'
}
