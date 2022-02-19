import {
  BitStringNode,
  ContextSpecific,
  Decoder,
  IntegerNode,
  Node,
  ObjectIdNode,
  OctetStringNode,
  SequenceNode
} from '@guarani/asn1'
import b64Url from '@guarani/base64url'
import { fromBuffer, toBuffer } from '@guarani/primitives'

import { InvalidJsonWebKeyException } from '../../../exceptions'
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
  let privateValue = toBuffer(b64Url.decode(key.d!, BigInt))

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
    throw new InvalidJsonWebKeyException('Malformed Elliptic Curve.')
  }

  if (publicKey.data[0] !== 0x04) {
    throw new InvalidJsonWebKeyException('Invalid Public Key.')
  }

  publicKey.displace(1)

  const left = publicKey.data.subarray(0, curve.length)
  const right = publicKey.data.subarray(curve.length)

  const x = b64Url.encode(fromBuffer(left, BigInt))
  const y = b64Url.encode(fromBuffer(right, BigInt))
  const d = b64Url.encode(fromBuffer(privateKey.data, BigInt))

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
    throw new InvalidJsonWebKeyException('Malformed Elliptic Curve.')
  }

  const curve = Object.values(ELLIPTIC_CURVES).find(
    curve => Buffer.compare(curve.buffer, curveOid) === 0
  )

  if (!curve) {
    throw new InvalidJsonWebKeyException('Malformed Elliptic Curve.')
  }

  const privateKey = decoder.octetstring().sequence()
  const version = privateKey.integer()

  if (version !== 1n) {
    throw new InvalidJsonWebKeyException()
  }

  const privateValue = privateKey.octetstring()
  const publicKey = privateKey.contextSpecific(0x01, false).bitstring()

  if (publicKey.data[0] !== 0x04) {
    throw new InvalidJsonWebKeyException('Invalid Public Key.')
  }

  publicKey.displace(1)

  const left = publicKey.data.subarray(0, curve.length)
  const right = publicKey.data.subarray(curve.length)

  const x = b64Url.encode(fromBuffer(left, BigInt))
  const y = b64Url.encode(fromBuffer(right, BigInt))
  const d = b64Url.encode(fromBuffer(privateValue.data, BigInt))

  return new EcKey({ crv: curve.id, x, y, d }, options)
}

/**
 * Encodes the provided key into a SEC.1 ASN.1 Abstract Syntax Tree.
 *
 * @param key Key to be encoded.
 * @returns SEC.1 ASN.1 Abstract Syntax Tree
 */
export function encodePrivateSec1(key: EcKey): Node<any> {
  const publicKey = getEncodedPublicKey(key)
  const curve = ELLIPTIC_CURVES[key.crv]
  const privateValue = getPaddedPrivateValue(key)

  return new SequenceNode([
    new IntegerNode(0x01),
    new OctetStringNode(privateValue),
    new ContextSpecific(
      0x00,
      'constructed',
      new ObjectIdNode(curve.oid).encode()
    ),
    new ContextSpecific(
      0x01,
      'constructed',
      new BitStringNode(publicKey).encode()
    )
  ])
}

/**
 * Encodes the provided key into a PKCS#8 ASN.1 Abstract Syntax Tree.
 *
 * @param key Key to be encoded.
 * @returns PKCS#8 ASN.1 Abstract Syntax Tree
 */
export function encodePrivatePkcs8(key: EcKey): Node<any> {
  const publicKey = getEncodedPublicKey(key)
  const curve = ELLIPTIC_CURVES[key.crv]
  const privateValue = getPaddedPrivateValue(key)

  const privateKey = new SequenceNode([
    new IntegerNode(0x01),
    new OctetStringNode(privateValue),
    new ContextSpecific(
      0x01,
      'constructed',
      new BitStringNode(publicKey).encode()
    )
  ])

  return new SequenceNode([
    new IntegerNode(0x00),
    new SequenceNode([
      new ObjectIdNode('1.2.840.10045.2.1'),
      new ObjectIdNode(curve.oid)
    ]),
    new OctetStringNode(privateKey.encode())
  ])
}
