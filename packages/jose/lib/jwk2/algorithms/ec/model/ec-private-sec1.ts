import { BitString, Class, Encoding, Integer, ObjectIdentifier, OctetString, Sequence } from '@guarani/asn1';

@Sequence()
export class ECPrivateSEC1 implements ECPrivateSEC1 {
  @Integer()
  public readonly version: bigint = 0x01n;

  @OctetString({ encoding: Encoding.Primitive })
  public readonly d!: string;

  @ObjectIdentifier({ class: Class.ContextSpecific, explicit: 0x00 })
  public readonly oid: string = '1.2.840.10045.3.1.7';

  @BitString({ class: Class.ContextSpecific, encoding: Encoding.Primitive, explicit: 0x01 })
  public readonly publicKey!: string;
}
