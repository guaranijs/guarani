import { BitString } from '../../../lib/decorators/bitstring'
import { Nested } from '../../../lib/decorators/nested'
import { Sequence } from '../../../lib/decorators/sequence'
import { Encoding } from '../../../lib/encoding'
import { EcPublicOid } from './ec-public-oid'
import { EcPublicSpkiParameters } from './ec-public-spki-parameters'

@Sequence()
export class EcPublicSpki {
  @Nested()
  public readonly oid: EcPublicOid = new EcPublicOid()

  @BitString({ encoding: Encoding.Primitive })
  public readonly publicKey!: EcPublicSpkiParameters
}
