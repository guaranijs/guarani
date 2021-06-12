import {
  Decoder,
  Integer,
  Node,
  Null,
  ObjectId,
  OctetString,
  Sequence
} from '@guarani/asn1'
import { Base64Url } from '@guarani/utils'

import { InvalidKey } from '../../../exceptions'
import { JsonWebKeyParams } from '../../jsonwebkey'
import { RsaKey } from './rsa.key'

/**
 * Parses a PKCS#1 encoded RSA Private Key.
 *
 * @param decoder - Decoder of the raw key.
 * @param options - Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function decodePrivatePkcs1(
  decoder: Decoder,
  options?: JsonWebKeyParams
): RsaKey {
  const n = Base64Url.encodeInt(decoder.integer())
  const e = Base64Url.encodeInt(decoder.integer())
  const d = Base64Url.encodeInt(decoder.integer())
  const p = Base64Url.encodeInt(decoder.integer())
  const q = Base64Url.encodeInt(decoder.integer())
  const dp = Base64Url.encodeInt(decoder.integer())
  const dq = Base64Url.encodeInt(decoder.integer())
  const qi = Base64Url.encodeInt(decoder.integer())

  return new RsaKey({ n, e, d, p, q, dp, dq, qi }, options)
}

/**
 * Parses a PKCS#8 encoded RSA Private Key.
 *
 * @param decoder - Decoder of the raw key.
 * @param options - Optional JSON Web Key Parameters.
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
 * @param key - Key to be encoded.
 * @returns PKCS#1 ASN.1 Abstract Syntax Tree
 */
export function encodePrivatePkcs1(key: RsaKey): Node {
  return new Sequence(
    new Integer(0x00),
    new Integer(Base64Url.decodeInt(key.n)),
    new Integer(Base64Url.decodeInt(key.e)),
    new Integer(Base64Url.decodeInt(key.d)),
    new Integer(Base64Url.decodeInt(key.p)),
    new Integer(Base64Url.decodeInt(key.q)),
    new Integer(Base64Url.decodeInt(key.dp)),
    new Integer(Base64Url.decodeInt(key.dq)),
    new Integer(Base64Url.decodeInt(key.qi))
  )
}

/**
 * Encodes the provided key into a X.509 SubjectPublicKeyInfo
 * ASN.1 Abstract Syntax Tree.
 *
 * @param key - Key to be encoded.
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
