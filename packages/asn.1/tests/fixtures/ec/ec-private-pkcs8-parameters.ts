import { bufferToInteger, integerToBuffer } from "@guarani/primitives";

import { Class } from "../../../lib/class";
import { BitString } from "../../../lib/decorators/bitstring";
import { Integer } from "../../../lib/decorators/integer";
import { OctetString } from "../../../lib/decorators/octetstring";
import { Sequence } from "../../../lib/decorators/sequence";
import { Transform } from "../../../lib/decorators/transform";
import { Encoding } from "../../../lib/encoding";
import { EcPublicSpkiParameters } from "./ec-public-spki-parameters";
import { paddBuffer } from "./_padd-buffer";

@Sequence()
export class EcPrivatePkcs8Parameters {
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

  @BitString({ class: Class.ContextSpecific, encoding: Encoding.Primitive, explicit: 0x01 })
  public readonly publicKey!: EcPublicSpkiParameters
}
