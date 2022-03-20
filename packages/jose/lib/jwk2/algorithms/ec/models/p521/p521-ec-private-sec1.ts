import { BitString, Class, Encoding, Integer, ObjectIdentifier, OctetString, Sequence, Transform } from '@guarani/asn1';
import { bufferToInteger, integerToBuffer } from '@guarani/primitives';

import { ECPrivateSEC1 } from '../ec-private-sec1';
import { paddBuffer } from '../_helpers';
import { P521ECPublicSPKIParameters } from './p521-ec-public-spki-parameters';

@Sequence()
export class P521ECPrivateSEC1 implements ECPrivateSEC1 {
  @Integer()
  public readonly version: bigint = 0x01n;

  @OctetString({ encoding: Encoding.Primitive })
  @Transform({
    afterDecode: [
      (value: string): Buffer => Buffer.from(value, 'hex'),
      (value: Buffer): Buffer => paddBuffer(value, 66),
      (value: Buffer): bigint => bufferToInteger(value),
    ],
    beforeEncode: [(value: bigint): Buffer => integerToBuffer(value), (value: Buffer): string => value.toString('hex')],
  })
  public readonly d!: bigint;

  @ObjectIdentifier({ class: Class.ContextSpecific, explicit: 0x00 })
  public readonly oid: string = '1.3.132.0.35';

  @BitString({ class: Class.ContextSpecific, encoding: Encoding.Primitive, explicit: 0x01 })
  public readonly publicKey!: P521ECPublicSPKIParameters;
}
