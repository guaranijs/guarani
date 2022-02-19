import { bufferToBinary, bufferToInteger, integerToBuffer } from "@guarani/primitives";

import { Class } from "../../../lib/class";
import { BitString } from "../../../lib/decorators/bitstring";
import { Integer } from "../../../lib/decorators/integer";
import { ObjectIdentifier } from "../../../lib/decorators/object-identifier";
import { OctetString } from "../../../lib/decorators/octetstring";
import { Sequence } from "../../../lib/decorators/sequence";
import { Transform } from "../../../lib/decorators/transform";
import { Encoding } from "../../../lib/encoding";
import { EcPublicSpkiParameters } from "./ec-public-spki-parameters";
import { paddBuffer } from "./_padd-buffer";

@Sequence()
export class EcPrivateSec1 {
  @Integer()
  public readonly version: bigint = 0x01n

  @OctetString({ encoding: Encoding.Primitive })
  @Transform({
    afterDecode: (value: string) => bufferToInteger(paddBuffer(Buffer.from(value, 'hex'), 32)),
    beforeEncode: [
      (value: bigint): Buffer => integerToBuffer(value),
      (value: Buffer): string => value.toString('hex'),
    ]
  })
  public readonly d!: bigint

  @ObjectIdentifier({ class: Class.ContextSpecific, explicit: 0x00 })
  public readonly oid: string = '1.2.840.10045.3.1.7'

  @BitString({ class: Class.ContextSpecific, encoding: Encoding.Primitive, explicit: 0x01 })
  public readonly publicKey!: EcPublicSpkiParameters
}
