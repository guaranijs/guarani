import { BitString, Class, Encoding, Integer, ObjectIdentifier, OctetString, Sequence, Transform } from '@guarani/asn1';
import { bufferToInteger, integerToBuffer } from '@guarani/primitives';

import { ECPrivateSEC1 } from '../ec-private-sec1';
import { paddBuffer } from '../_helpers';
import { P256ECPublicSPKIParameters } from './p256-ec-public-spki-parameters';

@Sequence()
export class P256ECPrivateSEC1 implements ECPrivateSEC1 {
  @Integer()
  public readonly version: bigint = 0x01n;

  @OctetString({ encoding: Encoding.Primitive })
  @Transform({
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): Buffer => paddBuffer(value, 32),
      (value: Buffer): bigint => bufferToInteger(value),
    ],
    beforeEncode: [(value: bigint): Buffer => integerToBuffer(value), (value: Buffer): string => value.toString('hex')],
  })
  public readonly d!: bigint;

  @ObjectIdentifier({ class: Class.ContextSpecific, explicit: 0x00 })
  public readonly oid: string = '1.2.840.10045.3.1.7';

  @BitString({ class: Class.ContextSpecific, encoding: Encoding.Primitive, explicit: 0x01 })
  public readonly publicKey!: P256ECPublicSPKIParameters;
}
