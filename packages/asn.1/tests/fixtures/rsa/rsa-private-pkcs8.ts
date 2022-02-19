import { Integer } from '../../../lib/decorators/integer'
import { Nested } from '../../../lib/decorators/nested'
import { OctetString } from '../../../lib/decorators/octetstring'
import { Sequence } from '../../../lib/decorators/sequence'
import { Encoding } from '../../../lib/encoding'
import { RsaPrivatePkcs1 } from './rsa-private-pkcs1'
import { RsaPublicPkcs1Oid } from './rsa-public-pkcs1-oid'

@Sequence()
export class RsaPrivatePkcs8 {
  @Integer()
  public readonly version: bigint = 0x00n

  @Nested()
  public readonly oid: RsaPublicPkcs1Oid = new RsaPublicPkcs1Oid()

  @OctetString({ encoding: Encoding.Primitive })
  public readonly privateKey!: RsaPrivatePkcs1
}
