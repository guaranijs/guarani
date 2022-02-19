import { ObjectId, Sequence } from '@guarani/asn1'
import { Optional } from '@guarani/types'

@Sequence()
export class PublicOid {
  @ObjectId()
  public readonly oid: string = '1.2.840.10045.2.1'

  @ObjectId()
  public readonly curveOid!: string

  public constructor(curveOid?: Optional<string>) {
    if (typeof curveOid !== 'undefined') {
      this.curveOid = curveOid
    }
  }
}
