import {
  BitString,
  ContextSpecific,
  Decoder,
  Integer,
  Node,
  ObjectId,
  OctetString,
  Sequence
} from '@guarani/asn1'
import {
  base64UrlDecodeInt,
  base64UrlEncodeInt,
  fromBuffer,
  toBuffer
} from '@guarani/utils'

import { InvalidKey } from '../../../exceptions'
import { JsonWebKeyParams } from '../../jsonwebkey'
import { EcKey } from './ec.key'
import { getEncodedPublicKey } from './_public'
import { ELLIPTIC_CURVES, ID_EC_PUBLIC_KEY } from './_types'

/**
 * Returns a 0-Padded Buffer version of the Private Value.
 *
 * @returns Padded Private Value.
 */
export function getPaddedPrivateValue(key: EcKey): Buffer {
  const curve = ELLIPTIC_CURVES[key.crv]
  let privateValue = toBuffer(base64UrlDecodeInt(key.d))

  while (privateValue.length < curve.length) {
    privateValue = Buffer.concat([toBuffer(0x00), privateValue])
  }

  return privateValue
}

/**
 * Parses a SEC.1 encoded Elliptic Curve Private Key.
 *
 * @param decoder Decoder of the raw key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an EcKey.
 */
export function decodePrivateSec1(
  decoder: Decoder,
  options?: JsonWebKeyParams
): EcKey {
  const privateKey = decoder.octetstring()
  const curveOid = decoder.contextSpecific(0x00, false).objectid()
  const publicKey = decoder.contextSpecific(0x01, false).bitstring()

  const curve = Object.values(ELLIPTIC_CURVES).find(
    curve => Buffer.compare(curve.buffer, curveOid) === 0
  )

  if (!curve) {
    throw new InvalidKey('Malformed Elliptic Curve.')
  }

  if (publicKey.data[0] !== 0x04) {
    throw new InvalidKey('Invalid Public Key.')
  }

  publicKey.displace(1)

  const left = publicKey.data.subarray(0, curve.length)
  const right = publicKey.data.subarray(curve.length)

  const x = base64UrlEncodeInt(fromBuffer(left, 'integer'))
  const y = base64UrlEncodeInt(fromBuffer(right, 'integer'))
  const d = base64UrlEncodeInt(fromBuffer(privateKey.data, 'integer'))

  return new EcKey({ crv: curve.id, x, y, d }, options)
}

/**
 * Parses a PKCS#8 encoded Elliptic Curve Private Key.
 *
 * @param decoder Decoder of the raw key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an EcKey.
 */
export function decodePrivatePkcs8(
  decoder: Decoder,
  options?: JsonWebKeyParams
): EcKey {
  const curveId = decoder.sequence()

  const pkcs8Id = curveId.objectid()
  const curveOid = curveId.objectid()

  if (Buffer.compare(pkcs8Id, ID_EC_PUBLIC_KEY) !== 0) {
    throw new InvalidKey('Malformed Elliptic Curve.')
  }

  const curve = Object.values(ELLIPTIC_CURVES).find(
    curve => Buffer.compare(curve.buffer, curveOid) === 0
  )

  if (!curve) {
    throw new InvalidKey('Malformed Elliptic Curve.')
  }

  const privateKey = decoder.octetstring().sequence()
  const version = privateKey.integer()

  if (version !== 1n) {
    throw new InvalidKey()
  }

  const privateValue = privateKey.octetstring()
  const publicKey = privateKey.contextSpecific(0x01, false).bitstring()

  if (publicKey.data[0] !== 0x04) {
    throw new InvalidKey('Invalid Public Key.')
  }

  publicKey.displace(1)

  const left = publicKey.data.subarray(0, curve.length)
  const right = publicKey.data.subarray(curve.length)

  const x = base64UrlEncodeInt(fromBuffer(left, 'integer'))
  const y = base64UrlEncodeInt(fromBuffer(right, 'integer'))
  const d = base64UrlEncodeInt(fromBuffer(privateValue.data, 'integer'))

  return new EcKey({ crv: curve.id, x, y, d }, options)
}

/**
 * Encodes the provided key into a SEC.1 ASN.1 Abstract Syntax Tree.
 *
 * @param key Key to be encoded.
 * @returns SEC.1 ASN.1 Abstract Syntax Tree
 */
export function encodePrivateSec1(key: EcKey): Node {
  const publicKey = getEncodedPublicKey(key)
  const curve = ELLIPTIC_CURVES[key.crv]
  const privateValue = getPaddedPrivateValue(key)

  return new Sequence(
    new Integer(0x01),
    new OctetString(privateValue),
    new ContextSpecific(0x00, 'constructed', new ObjectId(curve.oid).encode()),
    new ContextSpecific(0x01, 'constructed', new BitString(publicKey).encode())
  )
}

/**
 * Encodes the provided key into a PKCS#8 ASN.1 Abstract Syntax Tree.
 *
 * @param key Key to be encoded.
 * @returns PKCS#8 ASN.1 Abstract Syntax Tree
 */
export function encodePrivatePkcs8(key: EcKey): Node {
  const publicKey = getEncodedPublicKey(key)
  const curve = ELLIPTIC_CURVES[key.crv]
  const privateValue = getPaddedPrivateValue(key)

  const privateKey = new Sequence(
    new Integer(0x01),
    new OctetString(privateValue),
    new ContextSpecific(0x01, 'constructed', new BitString(publicKey).encode())
  )

  return new Sequence(
    new Integer(0x00),
    new Sequence(new ObjectId('1.2.840.10045.2.1'), new ObjectId(curve.oid)),
    new OctetString(privateKey.encode())
  )
}
