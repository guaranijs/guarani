import { BitString, Encoding, Nested, Sequence } from '@guarani/asn1';

import { ECPublicOID } from '../ec-public-oid';
import { ECPublicSPKI } from '../ec-public-spki';
import { P521ECPublicSPKIParameters } from './p521-ec-public-spki-parameters';

@Sequence()
export class P521ECPublicSPKI implements ECPublicSPKI {
  @Nested()
  public readonly oid: ECPublicOID = new ECPublicOID();

  @BitString({ encoding: Encoding.Primitive })
  public readonly publicKey!: P521ECPublicSPKIParameters;
}
