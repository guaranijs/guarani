import {
  BitString,
  Decoder,
  Integer,
  Node,
  Null,
  ObjectId,
  Sequence
} from '@guarani/asn1'
import { Base64Url } from '@guarani/utils'

import { InvalidKey } from '../../../exceptions'
import { JsonWebKeyParams } from '../../jsonwebkey'
import { RsaKey } from './rsa.key'

/**
 * Parses a PKCS#1 encoded RSA Public Key.
 *
 * @param decoder - Decoder of the raw key.
 * @param options - Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function decodePublicPkcs1(
  decoder: Decoder,
  options?: JsonWebKeyParams
): RsaKey {
  const n = Base64Url.encodeInt(decoder.integer())
  const e = Base64Url.encodeInt(decoder.integer())

  return new RsaKey({ n, e }, options)
}

/**
 * Parses a X.509 SubjectPublicKeyInfo encoded RSA Public Key.
 *
 * @param decoder - Decoder of the raw key.
 * @param options - Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function decodePublicX509(
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

  const numbers = decoder.bitstring().sequence()

  return decodePublicPkcs1(numbers, options)
}

/**
 * Encodes the provided key into a PKCS#1 ASN.1 Abstract Syntax Tree.
 *
 * @param key - Key to be encoded.
 * @returns PKCS#1 ASN.1 Abstract Syntax Tree
 */
export function encodePublicPkcs1(key: RsaKey): Node {
  return new Sequence(
    new Integer(Base64Url.decodeInt(key.n)),
    new Integer(Base64Url.decodeInt(key.e))
  )
}

/**
 * Encodes the provided key into a X.509 SubjectPublicKeyInfo
 * ASN.1 Abstract Syntax Tree.
 *
 * @param key - Key to be encoded.
 * @returns X.509 SubjectPublicKeyInfo ASN.1 Abstract Syntax Tree
 */
export function encodePublicX509(key: RsaKey): Node {
  const publicParams = encodePublicPkcs1(key)

  return new Sequence(
    new Sequence(new ObjectId('1.2.840.113549.1.1.1'), new Null()),
    new BitString(publicParams.encode())
  )
}
