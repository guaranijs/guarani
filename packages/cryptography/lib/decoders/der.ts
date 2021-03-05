import { Decoder } from './decoder'

export function DER (data: Buffer): Decoder {
  return new Decoder(data)
}
