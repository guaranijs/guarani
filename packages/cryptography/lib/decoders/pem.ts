import { Decoder } from './decoder'

export function PEM (pem: string): Decoder {
  const regex = /-----BEGIN [A-Z0-9- ]+-----\r?\n([a-zA-Z0-9+/=\r\n]+)-----END [A-Z0-9- ]+-----\r?\n/
  const match = pem.match(regex)
  if (!match) throw new Error('Invalid PEM encoded string.')
  const data = match[1].replace(/[\r\n]/g, '')
  return new Decoder(Buffer.from(data, 'base64'))
}
