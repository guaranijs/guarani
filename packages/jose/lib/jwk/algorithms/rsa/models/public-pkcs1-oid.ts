import { Null, ObjectId, Sequence } from '@guarani/asn1'

@Sequence()
export class PublicPkcs1Oid {
  @ObjectId()
  public readonly oid: string = '1.2.840.113549.1.1.1'

  @Null()
  public readonly nil: null = null
}
