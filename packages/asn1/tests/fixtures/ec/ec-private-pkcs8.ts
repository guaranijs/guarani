import { Optional } from "@guarani/types";

import { Integer } from "../../../lib/decorators/integer";
import { Nested } from "../../../lib/decorators/nested";
import { OctetString } from "../../../lib/decorators/octetstring";
import { Sequence } from "../../../lib/decorators/sequence";
import { EcPrivatePkcs8Parameters } from "./ec-private-pkcs8-parameters";
import { EcPublicOid } from "./ec-public-oid";

@Sequence()
export class EcPrivatePkcs8 {
  @Integer()
  public readonly version: bigint = 0x00n

  @Nested()
  public readonly oid: EcPublicOid = new EcPublicOid()

  @OctetString()
  public readonly privateKey!: EcPrivatePkcs8Parameters

  public constructor(privateKey?: Optional<EcPrivatePkcs8Parameters>) {
    if (typeof privateKey !== 'undefined') {
      this.privateKey = privateKey
    }
  }
}
