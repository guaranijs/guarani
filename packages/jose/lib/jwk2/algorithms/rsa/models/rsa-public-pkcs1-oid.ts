import { Null, ObjectIdentifier, Sequence } from '@guarani/asn1';

@Sequence()
export class RsaPublicPkcs1Oid {
  @ObjectIdentifier()
  public readonly oid: string = '1.2.840.113549.1.1.1';

  @Null()
  public readonly nil: null = null;
}
