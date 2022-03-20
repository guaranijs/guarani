import { Bytes, Nested, Transform, TransformersOptions } from '@guarani/asn1';
import { bufferToBinary, bufferToInteger, integerToBuffer } from '@guarani/primitives';
import { Constructor } from '@guarani/types';

import { paddBuffer } from './_helpers';

function getTransformers(length: number): TransformersOptions {
  return {
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): Buffer => paddBuffer(value, length),
      (value: Buffer): bigint => bufferToInteger(value),
    ],
    beforeEncode: [(value: bigint): Buffer => integerToBuffer(value), (value: Buffer): string => bufferToBinary(value)],
  };
}

export interface ECPublicSPKIParameters {
  readonly compression: bigint;
  readonly x: bigint;
  readonly y: bigint;
}

export function createECPublicSPKIParameters(curveLength: number): Constructor<ECPublicSPKIParameters> {
  @Nested()
  class Model {
    @Bytes(1)
    @Transform(getTransformers(1))
    public readonly compression: bigint = 0x04n;

    @Bytes(curveLength)
    @Transform(getTransformers(curveLength))
    public readonly x!: bigint;

    @Bytes(curveLength)
    @Transform(getTransformers(curveLength))
    public readonly y!: bigint;
  }

  Reflect.set(Model, 'name', 'ECPublicSPKIParameters');

  return Model;
}
