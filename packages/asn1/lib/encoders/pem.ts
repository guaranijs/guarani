import { Node } from '../nodes'

/**
 * Encodes the data of an ASN.1 Node into a PEM string.
 *
 * @param data - ASN.1 Node to be encoded.
 * @param label - Label to be used in the header and footer of the PEM string.
 * @returns Data of the ASN.1 Node encoded into a PEM string.
 */
export function PEM(data: Node, label: string): string {
  if (!(data instanceof Node)) throw new TypeError('Invalid parameter "data".')

  if (typeof label !== 'string' || label.length === 0)
    throw new TypeError('Invalid parameter "label".')

  let i = 0
  const b64 = data.encode().toString('base64')

  let response = `-----BEGIN ${label}-----\n`

  do response += `${b64.substr(i, 64)}\n`
  while ((i += 64) < b64.length)

  response += `${b64.substr(i)}`
  response += `-----END ${label}-----\n`

  return response
}
