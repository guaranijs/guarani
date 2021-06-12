import { Node } from '../nodes'

/**
 * Encodes the data of an ASN.1 Node into a DER array.
 *
 * @param data - ASN.1 Node to be encoded.
 * @returns Data of the ASN.1 Node encoded into a DER array.
 */
export function DEREncoder(data: Node): Buffer {
  if (!(data instanceof Node)) {
    throw new TypeError('Invalid parameter "data".')
  }

  return data.encode()
}
