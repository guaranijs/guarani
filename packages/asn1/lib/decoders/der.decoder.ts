import { Decoder } from './decoder'

/**
 * Loads the data of a DER Buffer into a Decoder.
 *
 * @param data - DER Buffer to be decoded.
 * @returns Instance of Decoder wrapping the DER Buffer.
 */
export function DERDecoder(data: Buffer): Decoder {
  if (!Buffer.isBuffer(data)) {
    throw new TypeError('Invalid parameter "data".')
  }

  return new Decoder(data)
}
