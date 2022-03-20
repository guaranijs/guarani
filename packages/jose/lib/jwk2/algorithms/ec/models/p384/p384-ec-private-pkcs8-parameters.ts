import { BitString, Class, Encoding, Integer, OctetString, Sequence, Transform } from '@guarani/asn1';
import { bufferToInteger, integerToBuffer } from '@guarani/primitives';

import { ECPrivatePKCS8Parameters } from '../ec-private-pkcs8-parameters';
import { paddBuffer } from '../_helpers';
import { P384ECPublicSPKIParameters } from './p384-ec-public-spki-parameters';

@Sequence()
export class P384ECPrivatePKCS8Parameters implements ECPrivatePKCS8Parameters {
  @Integer()
  public readonly version: bigint = 0x01n;

  @OctetString({ encoding: Encoding.Primitive })
  @Transform({
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): Buffer => paddBuffer(value, 48),
      (value: Buffer): bigint => bufferToInteger(value),
    ],
    beforeEncode: [(value: bigint): Buffer => integerToBuffer(value), (value: Buffer): string => value.toString('hex')],
  })
  public readonly d!: bigint;

  @BitString({ class: Class.ContextSpecific, encoding: Encoding.Primitive, explicit: 0x01 })
  public readonly publicKey!: P384ECPublicSPKIParameters;
}
