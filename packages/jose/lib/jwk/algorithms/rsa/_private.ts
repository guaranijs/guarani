import {
  Decoder,
  Integer,
  Node,
  Null,
  ObjectId,
  OctetString,
  Sequence
} from '@guarani/asn1'
import { base64UrlDecodeInt, base64UrlEncodeInt } from '@guarani/utils'

import { InvalidKey } from '../../../exceptions'
import { JsonWebKeyParams } from '../../jsonwebkey'
import { RsaKey } from './rsa.key'

/**
 * Parses a PKCS#1 encoded RSA Private Key.
 *
 * @param decoder Decoder of the raw key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function decodePrivatePkcs1(
  decoder: Decoder,
  options?: JsonWebKeyParams
): RsaKey {
  const n = base64UrlEncodeInt(decoder.integer())
  const e = base64UrlEncodeInt(decoder.integer())
  const d = base64UrlEncodeInt(decoder.integer())
  const p = base64UrlEncodeInt(decoder.integer())
  const q = base64UrlEncodeInt(decoder.integer())
  const dp = base64UrlEncodeInt(decoder.integer())
  const dq = base64UrlEncodeInt(decoder.integer())
  const qi = base64UrlEncodeInt(decoder.integer())

  return new RsaKey({ n, e, d, p, q, dp, dq, qi }, options)
}

/**
 * Parses a PKCS#8 encoded RSA Private Key.
 *
 * @param decoder Decoder of the raw key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function decodePrivatePkcs8(
  decoder: Decoder,
  options?: JsonWebKeyParams
): RsaKey {
  const oid = decoder.sequence()
  const objectId = Buffer.concat([
    new ObjectId('1.2.840.113549.1.1.1').encode(),
    new Null().encode()
  ])

  if (Buffer.compare(oid.data, objectId) !== 0) {
    throw new InvalidKey()
  }

  const numbers = decoder.octetstring().sequence()

  // Extracts the version of the private key.
  numbers.integer()

  return decodePrivatePkcs1(numbers, options)
}

/**
 * Encodes the provided key into a PKCS#1 ASN.1 Abstract Syntax Tree.
 *
 * @param key Key to be encoded.
 * @returns PKCS#1 ASN.1 Abstract Syntax Tree
 */
export function encodePrivatePkcs1(key: RsaKey): Node {
  return new Sequence(
    new Integer(0x00),
    new Integer(base64UrlDecodeInt(key.n)),
    new Integer(base64UrlDecodeInt(key.e)),
    new Integer(base64UrlDecodeInt(key.d!)),
    new Integer(base64UrlDecodeInt(key.p!)),
    new Integer(base64UrlDecodeInt(key.q!)),
    new Integer(base64UrlDecodeInt(key.dp!)),
    new Integer(base64UrlDecodeInt(key.dq!)),
    new Integer(base64UrlDecodeInt(key.qi!))
  )
}

/**
 * Encodes the provided key into a X.509 SubjectPublicKeyInfo
 * ASN.1 Abstract Syntax Tree.
 *
 * @param key Key to be encoded.
 * @returns X.509 SubjectPublicKeyInfo ASN.1 Abstract Syntax Tree
 */
export function encodePrivatePkcs8(key: RsaKey): Node {
  const privateParams = encodePrivatePkcs1(key)

  return new Sequence(
    new Integer(0x00),
    new Sequence(new ObjectId('1.2.840.113549.1.1.1'), new Null()),
    new OctetString(privateParams.encode())
  )
}
