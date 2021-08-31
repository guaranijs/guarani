import { BitString, Decoder, Node, ObjectId, Sequence } from '@guarani/asn1'
import {
  base64UrlDecodeInt,
  base64UrlEncodeInt,
  fromBuffer,
  toBuffer
} from '@guarani/utils'

import { InvalidKey } from '../../../exceptions'
import { JsonWebKeyParams } from '../../jsonwebkey'
import { EcKey, EcKeyParams } from './ec.key'
import { ELLIPTIC_CURVES, ID_EC_PUBLIC_KEY } from './_types'

/**
 * Returns the Curve's uncompressed coordinate parameters.
 *
 * @param key Key from where will be extracted the Public Params.
 * @returns Uncompressed coordinate parameters.
 */
export function getEncodedPublicKey(key: EcKeyParams): Buffer {
  const length = ELLIPTIC_CURVES[key.crv].length

  let x = toBuffer(base64UrlDecodeInt(key.x))
  let y = toBuffer(base64UrlDecodeInt(key.y))

  while (x.length < length) {
    x = Buffer.concat([toBuffer(0x00), x])
  }

  while (y.length < length) {
    y = Buffer.concat([toBuffer(0x00), y])
  }

  return Buffer.concat([toBuffer(0x04), x, y])
}

/**
 * Parses a X.509 SubjectPublicKeyInfo encoded Elliptic Curve Public Key.
 *
 * @param decoder Decoder of the raw key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an EcKey.
 */
export function decodePublicX509(
  decoder: Decoder,
  options?: JsonWebKeyParams
): EcKey {
  const curveData = decoder.sequence()
  const ecKeyOid = curveData.objectid()
  const curveOid = curveData.objectid()

  if (Buffer.compare(ecKeyOid, ID_EC_PUBLIC_KEY) !== 0) {
    throw new InvalidKey('Malformed curve.')
  }

  const curve = Object.values(ELLIPTIC_CURVES).find(
    curve => Buffer.compare(curve.buffer, curveOid) === 0
  )

  if (!curve) {
    throw new InvalidKey('Malformed curve.')
  }

  const publicKey = decoder.bitstring()

  if (publicKey.data[0] !== 0x04) {
    throw new InvalidKey('Invalid Public Key.')
  }

  publicKey.displace(1)

  const left = publicKey.data.subarray(0, curve.length)
  const right = publicKey.data.subarray(curve.length)

  const x = base64UrlEncodeInt(fromBuffer(left, 'integer'))
  const y = base64UrlEncodeInt(fromBuffer(right, 'integer'))

  return new EcKey({ crv: curve.id, x, y }, options)
}

/**
 * Encodes the provided key into a X.509 SubjectPublicKeyInfo
 * ASN.1 Abstract Syntax Tree.
 *
 * @param key Key to be encoded.
 * @returns X.509 SubjectPublicKeyInfo ASN.1 Abstract Syntax Tree
 */
export function encodePublicX509(key: EcKey): Node {
  return new Sequence(
    new Sequence(
      new ObjectId('1.2.840.10045.2.1'),
      new ObjectId(ELLIPTIC_CURVES[key.crv].oid)
    ),
    new BitString(getEncodedPublicKey(key))
  )
}
