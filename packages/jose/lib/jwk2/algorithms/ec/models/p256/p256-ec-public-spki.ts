import { BitString, Encoding, Nested, Sequence } from '@guarani/asn1';

import { ECPublicOID } from '../ec-public-oid';
import { ECPublicSPKI } from '../ec-public-spki';
import { P256ECPublicSPKIParameters } from './p256-ec-public-spki-parameters';

@Sequence()
export class P256ECPublicSPKI implements ECPublicSPKI {
  @Nested()
  public readonly oid: ECPublicOID = new ECPublicOID();

  @BitString({ encoding: Encoding.Primitive })
  public readonly publicKey!: P256ECPublicSPKIParameters;
}
