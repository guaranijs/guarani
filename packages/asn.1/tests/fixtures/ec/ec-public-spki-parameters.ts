import { bufferToBinary, bufferToInteger, integerToBuffer } from "@guarani/primitives"

import { Bytes } from "../../../lib/decorators/bytes"
import { Nested } from "../../../lib/decorators/nested"
import { Transform } from "../../../lib/decorators/transform"
import { paddBuffer } from "./_padd-buffer"

@Nested()
export class EcPublicSpkiParameters {
  @Bytes(1)
  @Transform({
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): bigint => bufferToInteger(value),
    ],
    beforeEncode: [
      (value: bigint): Buffer => integerToBuffer(value),
      (value: Buffer): string => bufferToBinary(value),
    ]
  })
  public readonly compression: bigint = 0x04n

  @Bytes(32)
  @Transform({
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): bigint => bufferToInteger(paddBuffer(value, 32)),
    ],
    beforeEncode: [
      (value: bigint): Buffer => integerToBuffer(value),
      (value: Buffer): string => bufferToBinary(value),
    ]
  })
  public readonly x!: bigint

  @Bytes(32)
  @Transform({
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): bigint => bufferToInteger(paddBuffer(value, 32)),
    ],
    beforeEncode: [
      (value: bigint): Buffer => integerToBuffer(value),
      (value: Buffer): string => bufferToBinary(value),
    ]
  })
  public readonly y!: bigint
}
