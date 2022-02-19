import { Decoder } from '@guarani/asn1'
import { encode } from '@guarani/base64url'
import { Optional } from '@guarani/types'

import { JsonWebKeyParams } from '../../jsonwebkey'
import { PrivatePkcs1, PrivatePkcs8, PublicPkcs1, PublicX509 } from './models'
import { RsaKey } from './rsa.key'

/**
 * Parses a DER encoded RSA Key.
 *
 * @param key DER representation of the RSA Key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function parseRsaKey(
  key: Buffer,
  options?: Optional<JsonWebKeyParams>
): RsaKey

/**
 * Parses a PEM encoded RSA Key.
 *
 * @param key PEM representation of the RSA Key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function parseRsaKey(
  key: string,
  options?: Optional<JsonWebKeyParams>
): RsaKey

/**
 * Parses the provided encoded RSA Key.
 *
 * @param key Encoded RSA Key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function parseRsaKey(
  key: Buffer | string,
  options?: Optional<JsonWebKeyParams>
): RsaKey {
  if (!Buffer.isBuffer(key) && typeof key !== 'string') {
    throw new TypeError('Invalid parameter "key".')
  }

  try {
    try {
      try {
        const decoder = Buffer.isBuffer(key)
          ? Decoder.DER(key, PrivatePkcs1)
          : Decoder.PEM(key, PrivatePkcs1)

        const pkcs1 = decoder.decode()

        return new RsaKey(
          {
            n: encode(pkcs1.n),
            e: encode(pkcs1.e),
            d: encode(pkcs1.d),
            p: encode(pkcs1.p),
            q: encode(pkcs1.q),
            dp: encode(pkcs1.dp),
            dq: encode(pkcs1.dq),
            qi: encode(pkcs1.qi)
          },
          options
        )
      } catch {
        const decoder = Buffer.isBuffer(key)
          ? Decoder.DER(key, PrivatePkcs8)
          : Decoder.PEM(key, PrivatePkcs8)

        const { privateKey: pkcs8 } = decoder.decode()

        return new RsaKey(
          {
            n: encode(pkcs8.n),
            e: encode(pkcs8.e),
            d: encode(pkcs8.d),
            p: encode(pkcs8.p),
            q: encode(pkcs8.q),
            dp: encode(pkcs8.dp),
            dq: encode(pkcs8.dq),
            qi: encode(pkcs8.qi)
          },
          options
        )
      }
    } catch {
      try {
        const decoder = Buffer.isBuffer(key)
          ? Decoder.DER(key, PublicPkcs1)
          : Decoder.PEM(key, PublicPkcs1)

        const pkcs1 = decoder.decode()

        return new RsaKey({ n: encode(pkcs1.n), e: encode(pkcs1.e) }, options)
      } catch {
        const decoder = Buffer.isBuffer(key)
          ? Decoder.DER(key, PublicX509)
          : Decoder.PEM(key, PublicX509)

        const { publicKey: x509 } = decoder.decode()

        return new RsaKey({ n: encode(x509.n), e: encode(x509.e) }, options)
      }
    }
  } catch {
    throw new Error('Could not parseRsaKey the provided key.')
  }
}
