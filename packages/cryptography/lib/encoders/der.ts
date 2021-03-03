import { Primitives } from '@guarani/utils'

import { ASN1 } from '../asn1'

export namespace DER {
  export function encode (asn1: ASN1): Buffer {
    const buffer = new ArrayBuffer(asn1.length)
    const elements = new Uint8Array(buffer)

    asn1.elements.forEach((element, i) => {
      if (element.length === 1) elements.set(element, i++)
      else element.forEach((byte) => elements.set(Primitives.toBuffer(byte), i++))
    })

    return Buffer.from(buffer)
  }
}
