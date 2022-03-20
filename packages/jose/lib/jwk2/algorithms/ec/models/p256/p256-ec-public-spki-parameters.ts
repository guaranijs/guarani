import { Bytes, Nested, Transform } from '@guarani/asn1';
import { bufferToBinary, bufferToInteger, integerToBuffer } from '@guarani/primitives';

import { ECPublicSPKIParameters } from '../ec-public-spki-parameters';
import { paddBuffer } from '../_helpers';

@Nested()
export class P256ECPublicSPKIParameters implements ECPublicSPKIParameters {
  @Bytes(1)
  @Transform({
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): bigint => bufferToInteger(value),
    ],
    beforeEncode: [(value: bigint): Buffer => integerToBuffer(value), (value: Buffer): string => bufferToBinary(value)],
  })
  public readonly compression: bigint = 0x04n;

  @Bytes(32)
  @Transform({
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): bigint => bufferToInteger(paddBuffer(value, 32)),
    ],
    beforeEncode: [(value: bigint): Buffer => integerToBuffer(value), (value: Buffer): string => bufferToBinary(value)],
  })
  public readonly x!: bigint;

  @Bytes(32)
  @Transform({
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): bigint => bufferToInteger(paddBuffer(value, 32)),
    ],
    beforeEncode: [(value: bigint): Buffer => integerToBuffer(value), (value: Buffer): string => bufferToBinary(value)],
  })
  public readonly y!: bigint;
}
