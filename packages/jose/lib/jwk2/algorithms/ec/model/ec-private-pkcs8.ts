import { Encoding, Integer, Nested, OctetString, Sequence } from '@guarani/asn1';

import { ECPrivatePKCS8Parameters } from './ec-private-pkcs8-parameters';
import { ECPublicOID } from './ec-public-oid';

@Sequence()
export class ECPrivatePKCS8 {
  @Integer()
  public readonly version: bigint = 0x00n;

  @Nested()
  public readonly oid!: ECPublicOID;

  @OctetString({ encoding: Encoding.Primitive })
  public readonly privateKey!: ECPrivatePKCS8Parameters;
}
