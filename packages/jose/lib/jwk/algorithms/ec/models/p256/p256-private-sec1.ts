import { Integer, OctetString, Sequence, Transform } from '@guarani/asn1'
import { bufferToInteger } from '@guarani/primitives'

import { ELLIPTIC_CURVES } from '../../_types'
import { paddBuffer } from '../_helpers'

const { length } = ELLIPTIC_CURVES['P-256']

@Sequence()
export class P256PrivateSec1 {
  @Integer()
  public readonly version: bigint = 0x01n

  @OctetString()
  @Transform(value => bufferToInteger(value))
  @Transform(value => paddBuffer(value, length))
  public readonly d!: bigint
}
