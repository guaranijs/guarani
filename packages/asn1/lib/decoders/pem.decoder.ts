import { Decoder } from './decoder'

/**
 * Parses the PEM string and loads it into a Decoder.
 *
 * @param pem - PEM string to be parsed and decoded.
 * @returns Instance of Decoder wrapping the PEM string.
 */
export function PEMDecoder(pem: string): Decoder {
  if (typeof pem !== 'string' || pem.length === 0) {
    throw new TypeError('Invalid parameter "pem".')
  }

  const regex = /-----BEGIN [A-Z0-9- ]+-----\r?\n([a-zA-Z0-9+/=\r\n]+)-----END [A-Z0-9- ]+-----[\r?\n]*/
  const match = pem.match(regex)

  if (!match) {
    throw new Error('Invalid PEM encoded string.')
  }

  const data = match[1].replace(/[\r\n]/g, '')

  return new Decoder(Buffer.from(data, 'base64'))
}
