import { Integer, Nested, OctetString, Sequence } from '@guarani/asn1'
import { Optional } from '@guarani/types'

import { PrivatePkcs1 } from './private-pkcs1'
import { PublicPkcs1Oid } from './public-pkcs1-oid'

@Sequence()
export class PrivatePkcs8 {
  @Integer()
  public readonly version: bigint = 0x00n

  @Nested()
  public readonly oid: PublicPkcs1Oid = new PublicPkcs1Oid()

  @OctetString()
  public readonly privateKey!: PrivatePkcs1

  public constructor(privateKey?: Optional<PrivatePkcs1>) {
    if (typeof privateKey !== 'undefined') {
      this.privateKey = privateKey
    }
  }
}
