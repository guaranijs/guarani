import { BitString, Bytes, Nested, Sequence, Transform } from '@guarani/asn1'
import { decode } from '@guarani/base64url'
import { bufferToInteger } from '@guarani/primitives'
import { Optional } from '@guarani/types'

import { ELLIPTIC_CURVES } from '../../_types'
import { PublicKeyParameters } from '../public-key-parameters'
import { PublicOid } from '../public-oid'
import { paddBuffer } from '../_helpers'

const { length } = ELLIPTIC_CURVES['P-256']

@Nested()
class P256PublicX509Parameters {
  @Bytes(1)
  @Transform(value => Number(value[0]))
  public readonly compression: number = 0x04

  @Bytes(length)
  @Transform(value => bufferToInteger(value))
  @Transform(value => paddBuffer(value, length))
  public readonly x!: bigint

  @Bytes(length)
  @Transform(value => bufferToInteger(value))
  @Transform(value => paddBuffer(value, length))
  public readonly y!: bigint

  public constructor(params?: Optional<PublicKeyParameters>) {
    if (typeof params !== 'undefined') {
      if (typeof params.compression !== 'undefined') {
        this.compression = params.compression
      }

      this.x = decode(params.x, BigInt)
      this.y = decode(params.y, BigInt)
    }
  }
}

@Sequence()
export class P256PublicX509 {
  @Nested()
  public readonly oid!: PublicOid

  @BitString()
  public readonly publicKey!: P256PublicX509Parameters
}
