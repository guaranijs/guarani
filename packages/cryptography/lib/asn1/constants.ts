import { Primitives } from '@guarani/utils'

export const Tags = {
  ZERO: Primitives.toBuffer(0x00),
  BOOLEAN: Primitives.toBuffer(0x01),
  INTEGER: Primitives.toBuffer(0x02),
  BITSTRING: Primitives.toBuffer(0x03),
  OCTETSTRING: Primitives.toBuffer(0x04),
  NULL: Primitives.toBuffer(0x05),
  OBJECTID: Primitives.toBuffer(0x06),
  SEQUENCE: Primitives.toBuffer(0x30)
}
