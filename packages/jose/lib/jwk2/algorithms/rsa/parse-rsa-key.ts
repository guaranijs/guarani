import { DerDecoder } from '@guarani/asn1';
import { encode } from '@guarani/base64url';
import { Optional } from '@guarani/types';
import { fromPEM } from '@guarani/utils';

import { JsonWebKeyParams } from '../../jsonwebkey';
import { RsaPrivatePkcs1 } from './models/rsa-private-pkcs1';
import { RsaPrivatePkcs8 } from './models/rsa-private-pkcs8';
import { RsaPublicPkcs1 } from './models/rsa-public-pkcs1';
import { RsaPublicSpki } from './models/rsa-public-spki';
import { RsaKey } from './rsa.key';

/**
 * Parses a DER encoded RSA Key.
 *
 * @param key DER representation of the RSA Key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function parseRsaKey(key: Buffer, options?: Optional<JsonWebKeyParams>): RsaKey;

/**
 * Parses a PEM encoded RSA Key.
 *
 * @param key PEM representation of the RSA Key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function parseRsaKey(key: string, options?: Optional<JsonWebKeyParams>): RsaKey;

/**
 * Parses the provided encoded RSA Key.
 *
 * @param key Encoded RSA Key.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export function parseRsaKey(key: Buffer | string, options?: Optional<JsonWebKeyParams>): RsaKey {
  if (!Buffer.isBuffer(key) && typeof key !== 'string') {
    throw new TypeError('Invalid parameter "key".');
  }

  try {
    try {
      try {
        const decoder = new DerDecoder(Buffer.isBuffer(key) ? key : fromPEM(key), RsaPrivatePkcs1);
        const pkcs1 = decoder.decode();

        return new RsaKey(
          {
            n: encode(pkcs1.n),
            e: encode(pkcs1.e),
            d: encode(pkcs1.d),
            p: encode(pkcs1.p),
            q: encode(pkcs1.q),
            dp: encode(pkcs1.dp),
            dq: encode(pkcs1.dq),
            qi: encode(pkcs1.qi),
          },
          options
        );
      } catch {
        const decoder = new DerDecoder(Buffer.isBuffer(key) ? key : fromPEM(key), RsaPrivatePkcs8);
        const { privateKey: pkcs8 } = decoder.decode();

        return new RsaKey(
          {
            n: encode(pkcs8.n),
            e: encode(pkcs8.e),
            d: encode(pkcs8.d),
            p: encode(pkcs8.p),
            q: encode(pkcs8.q),
            dp: encode(pkcs8.dp),
            dq: encode(pkcs8.dq),
            qi: encode(pkcs8.qi),
          },
          options
        );
      }
    } catch {
      try {
        const decoder = new DerDecoder(Buffer.isBuffer(key) ? key : fromPEM(key), RsaPublicPkcs1);
        const pkcs1 = decoder.decode();

        return new RsaKey({ n: encode(pkcs1.n), e: encode(pkcs1.e) }, options);
      } catch {
        const decoder = new DerDecoder(Buffer.isBuffer(key) ? key : fromPEM(key), RsaPublicSpki);
        const { publicKey: spki } = decoder.decode();

        return new RsaKey({ n: encode(spki.n), e: encode(spki.e) }, options);
      }
    }
  } catch {
    throw new Error('Could not parse the provided key.');
  }
}
