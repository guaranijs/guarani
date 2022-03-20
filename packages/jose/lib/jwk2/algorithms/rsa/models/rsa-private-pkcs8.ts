import { Encoding, Integer, Nested, OctetString, Sequence } from '@guarani/asn1';

import { RsaPrivatePkcs1 } from './rsa-private-pkcs1';
import { RsaPublicPkcs1Oid } from './rsa-public-pkcs1-oid';

@Sequence()
export class RsaPrivatePkcs8 {
  @Integer()
  public readonly version: bigint = 0x00n;

  @Nested()
  public readonly oid: RsaPublicPkcs1Oid = new RsaPublicPkcs1Oid();

  @OctetString({ encoding: Encoding.Primitive })
  public readonly privateKey!: RsaPrivatePkcs1;
}
