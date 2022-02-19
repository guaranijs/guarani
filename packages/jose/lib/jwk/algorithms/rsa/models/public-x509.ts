import { BitString, Nested, Sequence } from '@guarani/asn1'
import { Optional } from '@guarani/types'

import { PublicPkcs1 } from './public-pkcs1'
import { PublicPkcs1Oid } from './public-pkcs1-oid'

@Sequence()
export class PublicX509 {
  @Nested()
  public readonly oid: PublicPkcs1Oid = new PublicPkcs1Oid()

  @BitString()
  public readonly publicKey!: PublicPkcs1

  public constructor(publicKey?: Optional<PublicPkcs1>) {
    if (typeof publicKey !== 'undefined') {
      this.publicKey = publicKey
    }
  }
}
