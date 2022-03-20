import { DerEncoder } from '@guarani/asn1';
import { toPEM } from '@guarani/utils';
import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-json-web-key.exception';

import { RsaPrivatePkcs1 } from './models/rsa-private-pkcs1';
import { RsaPrivatePkcs8 } from './models/rsa-private-pkcs8';
import { RsaPublicPkcs1 } from './models/rsa-public-pkcs1';
import { RsaPublicSpki } from './models/rsa-public-spki';

import { RsaKey } from './rsa.key';

type KeyEncoding = 'der' | 'pem';
type KeyFormat = 'pkcs1' | 'pkcs8' | 'spki';
type KeyType = 'private' | 'public';

interface ExportRsaKeyOptions<E extends KeyEncoding, F extends KeyFormat, T extends KeyType> {
  /**
   * Encoding of the exported data.
   */
  readonly encoding: E;

  /**
   * Protocol used to encode the data.
   */
  readonly format: F;

  /**
   * Type of the key to be exported.
   */
  readonly type: T;
}

/**
 * Returns the PKCS#1 RSA Private Key DER Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const pkcs1 = exportRsaKey(rsaKey, {
 * >   encoding: 'der',
 * >   format: 'pkcs1',
 * >   type: 'private'
 * > })
 * >
 * > pkcs1
 * <Buffer 30 82 04 a4 02 01 00 02 82 01 01 00 c6 3a 45 ... 1177 more bytes>
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns DER Encoded PKCS#1 RSA Private Key.
 */
export function exportRsaKey(key: RsaKey, options: ExportRsaKeyOptions<'der', 'pkcs1', 'private'>): Buffer;

/**
 * Returns the PKCS#1 RSA Private Key PEM Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const pkcs1 = exportRsaKey(rsaKey, {
 * >   encoding: 'pem',
 * >   format: 'pkcs1',
 * >   type: 'private'
 * > })
 * >
 * > pkcs1
 * -----BEGIN RSA PRIVATE KEY-----
 * <Base64 representation...>
 * -----END RSA PRIVATE KEY-----
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns PEM Encoded PKCS#1 RSA Private Key.
 */
export function exportRsaKey(key: RsaKey, options: ExportRsaKeyOptions<'pem', 'pkcs1', 'private'>): string;

/**
 * Returns the PKCS#8 RSA Private Key DER Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const pkcs8 = exportRsaKey(rsaKey, {
 * >   encoding: 'der',
 * >   format: 'pkcs8',
 * >   type: 'private'
 * > })
 * >
 * > pkcs8
 * <Buffer 30 82 04 be 02 01 00 30 0d 06 09 2a 86 48 86 ... 1203 more bytes>
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns DER Encoded PKCS#8 RSA Private Key.
 */
export function exportRsaKey(key: RsaKey, options: ExportRsaKeyOptions<'der', 'pkcs8', 'private'>): Buffer;

/**
 * Returns the PKCS#8 RSA Private Key PEM Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const pkcs8 = exportRsaKey(rsaKey, {
 * >   encoding: 'pem',
 * >   format: 'pkcs8',
 * >   type: 'private'
 * > })
 * >
 * > pkcs8
 * -----BEGIN PRIVATE KEY-----
 * <Base64 representation...>
 * -----END PRIVATE KEY-----
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns PEM Encoded PKCS#8 RSA Private Key.
 */
export function exportRsaKey(key: RsaKey, options: ExportRsaKeyOptions<'pem', 'pkcs8', 'private'>): string;

/**
 * Returns the PKCS#1 RSA Public Key DER Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const pkcs1 = exportRsaKey(rsaKey, {
 * >   encoding: 'der',
 * >   format: 'pkcs1',
 * >   type: 'public'
 * > })
 * >
 * > pkcs1
 * <Buffer 30 82 01 0a 02 82 01 01 00 c6 3a 45 c9 dc d3 ... 255 more bytes>
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns DER Encoded PKCS#1 RSA Public Key.
 */
export function exportRsaKey(key: RsaKey, options: ExportRsaKeyOptions<'der', 'pkcs1', 'public'>): Buffer;

/**
 * Returns the PKCS#1 RSA Public Key PEM Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const pkcs1 = exportRsaKey(rsaKey, {
 * >   encoding: 'pem',
 * >   format: 'pkcs1',
 * >   type: 'public'
 * > })
 * >
 * > pkcs1
 * -----BEGIN RSA PUBLIC KEY-----
 * <Base64 representation...>
 * -----END RSA PUBLIC KEY-----
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns PEM Encoded PKCS#1 RSA Public Key.
 */
export function exportRsaKey(key: RsaKey, options: ExportRsaKeyOptions<'pem', 'pkcs1', 'public'>): string;

/**
 * Returns the SPKI RSA Public Key DER Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const spki = exportRsaKey(rsaKey, {
 * >   encoding: 'der',
 * >   format: 'spki',
 * >   type: 'public'
 * > })
 * >
 * > spki
 * <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 ... 279 more bytes>
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns DER Encoded SPKI RSA Public Key.
 */
export function exportRsaKey(key: RsaKey, options: ExportRsaKeyOptions<'der', 'spki', 'public'>): Buffer;

/**
 * Returns the SPKI RSA Public Key PEM Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const spki = exportRsaKey(rsaKey, {
 * >   encoding: 'pem',
 * >   format: 'spki',
 * >   type: 'public'
 * > })
 * >
 * > spki
 * -----BEGIN PUBLIC KEY-----
 * <Base64 representation...>
 * -----END PUBLIC KEY-----
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns PEM Encoded SPKI RSA Public Key.
 */
export function exportRsaKey(key: RsaKey, options: ExportRsaKeyOptions<'pem', 'spki', 'public'>): string;

/**
 * Returns the encoded RSA Key based on the provided options.
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns Encoded RSA Key.
 */
export function exportRsaKey<E extends KeyEncoding, F extends KeyFormat, T extends KeyType>(
  key: RsaKey,
  options: ExportRsaKeyOptions<E, F, T>
): string | Buffer {
  const { encoding, format, type } = options;

  let model: object;
  let label: string;

  switch (type) {
    // Private Key.
    case 'private': {
      if (key.d === undefined) {
        throw new InvalidJsonWebKeyException('The provided key is not an RSA Private Key.');
      }

      const { n, e, d, p, q, dp, dq, qi } = key;
      const privateKey = <RsaPrivatePkcs1>Object.assign<RsaPrivatePkcs1, Omit<RsaPrivatePkcs1, 'version'>>(
        new RsaPrivatePkcs1(),
        {
          n: Buffer.from(n, 'base64url').readBigUInt64BE(),
          e: Buffer.from(e, 'base64url').readBigUInt64BE(),
          d: Buffer.from(d!, 'base64url').readBigUInt64BE(),
          p: Buffer.from(p!, 'base64url').readBigUInt64BE(),
          q: Buffer.from(q!, 'base64url').readBigUInt64BE(),
          dp: Buffer.from(dp!, 'base64url').readBigUInt64BE(),
          dq: Buffer.from(dq!, 'base64url').readBigUInt64BE(),
          qi: Buffer.from(qi!, 'base64url').readBigUInt64BE(),
        }
      );

      switch (format) {
        // PKCS#1 RSA Private Key.
        case 'pkcs1':
          model = privateKey;
          label = 'RSA PRIVATE KEY';
          break;

        // PKCS#8 RSA Private Key.
        case 'pkcs8':
          model = <RsaPrivatePkcs8>Object.assign(new RsaPrivatePkcs8(), { privateKey });
          label = 'PRIVATE KEY';
          break;

        default:
          throw new TypeError(`Unsupported RSA Private Key format "${format}".`);
      }

      break;
    }

    // Public Key.
    case 'public': {
      const { n, e } = key;
      const publicKey = <RsaPublicPkcs1>Object.assign<RsaPublicPkcs1, RsaPublicPkcs1>(new RsaPublicPkcs1(), {
        n: Buffer.from(n, 'base64url').readBigUInt64BE(),
        e: Buffer.from(e, 'base64url').readBigUInt64BE(),
      });

      switch (format) {
        // PKCS#1 RSA Public Key.
        case 'pkcs1':
          model = publicKey;
          label = 'RSA PUBLIC KEY';
          break;

        // SPKI RSA Public Key.
        case 'spki':
          model = <RsaPublicSpki>Object.assign(new RsaPublicSpki(), { publicKey });
          label = 'PUBLIC KEY';
          break;

        default:
          throw new TypeError(`Unsupported RSA Public Key format "${format}".`);
      }

      break;
    }

    default:
      throw new TypeError(`Unsupported RSA Key type "${type}".`);
  }

  const encoder = new DerEncoder();
  const encoded = encoder.encode(model);

  return encoding === 'der' ? encoded : toPEM(encoded, label);
}
