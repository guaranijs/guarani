import { BitString, Encoding, Nested, Sequence } from '@guarani/asn1';

import { RsaPublicPkcs1 } from './rsa-public-pkcs1';
import { RsaPublicPkcs1Oid } from './rsa-public-pkcs1-oid';

@Sequence()
export class RsaPublicSpki {
  @Nested()
  public readonly oid: RsaPublicPkcs1Oid = new RsaPublicPkcs1Oid();

  @BitString({ encoding: Encoding.Primitive })
  public readonly publicKey!: RsaPublicPkcs1;
}
