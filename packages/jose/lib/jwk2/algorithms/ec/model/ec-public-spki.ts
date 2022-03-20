import { BitString, Encoding, Nested, Sequence } from '@guarani/asn1';

import { ECPublicOID } from './ec-public-oid';

@Sequence()
export class ECPublicSPKI {
  @Nested()
  public readonly oid!: ECPublicOID;

  @BitString({ encoding: Encoding.Primitive })
  public readonly publicKey!: string;
}
