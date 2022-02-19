import { bufferToInteger, integerToBuffer } from "@guarani/primitives";
import { Dict, Optional } from "@guarani/types";

import { Class } from "../../../lib/class";
import { BitString } from "../../../lib/decorators/bitstring";
import { Decode } from "../../../lib/decorators/decode";
import { Encode } from "../../../lib/decorators/encode";
import { Integer } from "../../../lib/decorators/integer";
import { ObjectId } from "../../../lib/decorators/objectid";
import { OctetString } from "../../../lib/decorators/octetstring";
import { Sequence } from "../../../lib/decorators/sequence";
import { EcPublicSpkiParameters } from "./ec-public-spki-parameters";
import { paddBuffer } from "./_padd-buffer";

@Sequence()
export class EcPrivateSec1 {
  @Integer()
  public readonly version: bigint = 0x01n

  @OctetString()
  @Decode((value: Buffer) => bufferToInteger(paddBuffer(value, 32)))
  @Encode((value: bigint) => integerToBuffer(value, true))
  public readonly d!: bigint

  @ObjectId({ class: Class.ContextSpecific, explicit: 0x00 })
  public readonly oid: string = '1.2.840.10045.3.1.7'

  @BitString({ class: Class.ContextSpecific, explicit: 0x01 })
  public readonly publicKey!: EcPublicSpkiParameters

  public constructor(params?: Optional<Dict<bigint>>) {
    if (typeof params !== 'undefined') {
      this.d = params.d
      this.publicKey = new EcPublicSpkiParameters({ x: params.x, y: params.y })
    }
  }
}
