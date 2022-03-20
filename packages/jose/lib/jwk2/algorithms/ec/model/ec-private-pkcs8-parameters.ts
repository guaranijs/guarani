import { BitString, Class, Encoding, Integer, OctetString, Sequence } from '@guarani/asn1';

@Sequence()
export class ECPrivatePKCS8Parameters {
  @Integer()
  public readonly version: bigint = 0x01n;

  @OctetString({ encoding: Encoding.Primitive })
  public readonly d!: string;

  @BitString({ class: Class.ContextSpecific, encoding: Encoding.Primitive, explicit: 0x01 })
  public readonly publicKey!: string;
}
