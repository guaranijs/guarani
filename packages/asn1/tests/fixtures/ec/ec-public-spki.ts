import { Optional } from '@guarani/types'

import { BitString } from '../../../lib/decorators/bitstring'
import { Nested } from '../../../lib/decorators/nested'
import { Sequence } from '../../../lib/decorators/sequence'
import { EcPublicOid } from './ec-public-oid'
import { EcPublicSpkiParameters } from './ec-public-spki-parameters'

@Sequence()
export class EcPublicSpki {
  @Nested()
  public readonly oid: EcPublicOid = new EcPublicOid()

  @BitString()
  public readonly publicKey!: EcPublicSpkiParameters

  public constructor(publicKey?: Optional<EcPublicSpkiParameters>) {
    if (typeof publicKey !== 'undefined') {
      this.publicKey = publicKey
    }
  }
}
