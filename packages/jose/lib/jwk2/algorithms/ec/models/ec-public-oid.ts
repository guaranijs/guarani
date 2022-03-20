import { ObjectIdentifier, Sequence } from '@guarani/asn1';

@Sequence()
export class ECPublicOID {
  @ObjectIdentifier()
  public readonly oid: string = '1.2.840.10045.2.1';

  @ObjectIdentifier()
  public readonly curveOid!: string;
}
