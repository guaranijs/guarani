import { Optional } from '@guarani/types'

import { BitString } from '../../../lib/decorators/bitstring'
import { Nested } from '../../../lib/decorators/nested'
import { Sequence } from '../../../lib/decorators/sequence'
import { RsaPublicPkcs1 } from './rsa-public-pkcs1'
import { RsaPublicPkcs1Oid } from './rsa-public-pkcs1-oid'

@Sequence()
export class RsaPublicSpki {
  @Nested()
  public readonly oid: RsaPublicPkcs1Oid = new RsaPublicPkcs1Oid()

  @BitString()
  public readonly publicKey!: RsaPublicPkcs1

  public constructor(publicKey?: Optional<RsaPublicPkcs1>) {
    if (typeof publicKey !== 'undefined') {
      this.publicKey = publicKey
    }
  }
}
