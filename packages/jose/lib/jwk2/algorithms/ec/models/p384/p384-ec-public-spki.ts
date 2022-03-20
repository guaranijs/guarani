import { BitString, Encoding, Nested, Sequence } from '@guarani/asn1';

import { ECPublicOID } from '../ec-public-oid';
import { ECPublicSPKI } from '../ec-public-spki';
import { P384ECPublicSPKIParameters } from './p384-ec-public-spki-parameters';

@Sequence()
export class P384ECPublicSPKI implements ECPublicSPKI {
  @Nested()
  public readonly oid: ECPublicOID = new ECPublicOID();

  @BitString({ encoding: Encoding.Primitive })
  public readonly publicKey!: P384ECPublicSPKIParameters;
}
