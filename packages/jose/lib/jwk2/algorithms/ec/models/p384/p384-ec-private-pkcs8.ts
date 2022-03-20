import { Encoding, Integer, Nested, OctetString, Sequence } from '@guarani/asn1';

import { ECPrivatePKCS8 } from '../ec-private-pkcs8';
import { ECPublicOID } from '../ec-public-oid';
import { P384ECPrivatePKCS8Parameters } from './p384-ec-private-pkcs8-parameters';

@Sequence()
export class P384ECPrivatePKCS8 implements ECPrivatePKCS8 {
  @Integer()
  public readonly version: bigint = 0x00n;

  @Nested()
  public readonly oid: ECPublicOID = new ECPublicOID();

  @OctetString({ encoding: Encoding.Primitive })
  public readonly privateKey!: P384ECPrivatePKCS8Parameters;
}
