import { bufferToInteger, integerToBuffer } from '@guarani/primitives'
import { Dict, Optional } from '@guarani/types'

import { Bytes } from '../../../lib/decorators/bytes'
import { Decode } from '../../../lib/decorators/decode'
import { Encode } from '../../../lib/decorators/encode'
import { Nested } from '../../../lib/decorators/nested'
import { paddBuffer } from './_padd-buffer'

@Nested()
export class EcPublicSpkiParameters {
  @Bytes(1)
  @Decode((value: Buffer) => BigInt(value[0]))
  public readonly compression: bigint = 0x04n

  @Bytes(32)
  @Decode((value: Buffer) => bufferToInteger(paddBuffer(value, 32)))
  @Encode((value: bigint) => integerToBuffer(value, true))
  public readonly x!: bigint

  @Bytes(32)
  @Decode((value: Buffer) => bufferToInteger(paddBuffer(value, 32)))
  @Encode((value: bigint) => integerToBuffer(value, true))
  public readonly y!: bigint

  public constructor(params?: Optional<Dict<bigint>>) {
    if (typeof params !== 'undefined') {
      this.x = params.x
      this.y = params.y
    }
  }
}
