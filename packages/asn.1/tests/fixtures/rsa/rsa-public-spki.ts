import { BitString } from '../../../lib/decorators/bitstring'
import { Nested } from '../../../lib/decorators/nested'
import { Sequence } from '../../../lib/decorators/sequence'
import { Encoding } from '../../../lib/encoding'
import { RsaPublicPkcs1 } from './rsa-public-pkcs1'
import { RsaPublicPkcs1Oid } from './rsa-public-pkcs1-oid'

@Sequence()
export class RsaPublicSpki {
  @Nested()
  public readonly oid: RsaPublicPkcs1Oid = new RsaPublicPkcs1Oid()

  @BitString({ encoding: Encoding.Primitive })
  public readonly publicKey!: RsaPublicPkcs1
}
