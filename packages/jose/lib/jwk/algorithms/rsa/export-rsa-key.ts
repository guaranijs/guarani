import { DEREncoder } from '@guarani/asn1'

import { PrivatePkcs1, PrivatePkcs8, PublicPkcs1, PublicX509 } from './models'
import { RsaKey } from './rsa.key'

type KeyEncoding = 'der' | 'pem'
type KeyFormat = 'pkcs1' | 'pkcs8' | 'x509'
type KeyType = 'private' | 'public'

interface ExportRsaKeyOptions<
  E extends KeyEncoding,
  F extends KeyFormat,
  T extends KeyType
> {
  /**
   * Encoding of the exported data.
   */
  readonly encoding: E

  /**
   * Protocol used to encode the data.
   */
  readonly format: F

  /**
   * Type of the key to be exported.
   */
  readonly type: T
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
export function exportRsaKey(
  key: RsaKey,
  options: ExportRsaKeyOptions<'der', 'pkcs1', 'private'>
): Buffer

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
export function exportRsaKey(
  key: RsaKey,
  options: ExportRsaKeyOptions<'pem', 'pkcs1', 'private'>
): string

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
export function exportRsaKey(
  key: RsaKey,
  options: ExportRsaKeyOptions<'der', 'pkcs8', 'private'>
): Buffer

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
export function exportRsaKey(
  key: RsaKey,
  options: ExportRsaKeyOptions<'pem', 'pkcs8', 'private'>
): string

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
export function exportRsaKey(
  key: RsaKey,
  options: ExportRsaKeyOptions<'der', 'pkcs1', 'public'>
): Buffer

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
export function exportRsaKey(
  key: RsaKey,
  options: ExportRsaKeyOptions<'pem', 'pkcs1', 'public'>
): string

/**
 * Returns the X.509 RSA Public Key DER Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const x509 = exportRsaKey(rsaKey, {
 * >   encoding: 'der',
 * >   format: 'pkcs1',
 * >   type: 'public'
 * > })
 * >
 * > x509
 * <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 ... 279 more bytes>
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns DER Encoded X.509 RSA Public Key.
 */
export function exportRsaKey(
  key: RsaKey,
  options: ExportRsaKeyOptions<'der', 'x509', 'public'>
): Buffer

/**
 * Returns the X.509 RSA Public Key PEM Encoding of the provided RSA Key.
 *
 * @example
 * ```
 * > const x509 = exportRsaKey(rsaKey, {
 * >   encoding: 'pem',
 * >   format: 'x509',
 * >   type: 'public'
 * > })
 * >
 * > x509
 * -----BEGIN PUBLIC KEY-----
 * <Base64 representation...>
 * -----END PUBLIC KEY-----
 * ```
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns PEM Encoded X.509 RSA Public Key.
 */
export function exportRsaKey(
  key: RsaKey,
  options: ExportRsaKeyOptions<'pem', 'x509', 'public'>
): string

/**
 * Returns the encoded RSA Key based on the provided options.
 *
 * @param key RSA Key to be exported.
 * @param options Options to define the result of the export.
 * @returns Encoded RSA Key.
 */
export function exportRsaKey<
  E extends KeyEncoding,
  F extends KeyFormat,
  T extends KeyType
>(key: RsaKey, options: ExportRsaKeyOptions<E, F, T>): string | Buffer {
  const { encoding, format, type } = options

  if (type !== 'private' && type !== 'public') {
    throw new TypeError('Invalid option "type".')
  }

  if (encoding !== 'der' && encoding !== 'pem') {
    throw new TypeError('Invalid option "encoding".')
  }

  if (
    (type === 'public' && format !== 'pkcs1' && format !== 'x509') ||
    (type === 'private' && format !== 'pkcs1' && format !== 'pkcs8')
  ) {
    throw new TypeError('Invalid option "format".')
  }

  let model: object
  let label: string

  // Private Key.
  if (type === 'private') {
    const privateKey = new PrivatePkcs1({
      n: key.n,
      e: key.e,
      d: key.d!,
      p: key.p!,
      q: key.q!,
      dp: key.dp!,
      dq: key.dq!,
      qi: key.qi!
    })

    // PKCS#1 RSA Private Key.
    if (format === 'pkcs1') {
      model = privateKey
      label = 'RSA PRIVATE KEY'
    }

    // PKCS#8 RSA Private Key.
    else if (format === 'pkcs8') {
      model = new PrivatePkcs8(privateKey)
      label = 'PRIVATE KEY'
    }
  }

  // Public Key.
  else if (type === 'public') {
    const publicKey = new PublicPkcs1({ n: key.n, e: key.e })

    // PKCS#1 RSA Public Key.
    if (format === 'pkcs1') {
      model = publicKey
      label = 'RSA PUBLIC KEY'
    }

    // X.509 RSA Public Key.
    else if (format === 'x509') {
      model = new PublicX509(publicKey)
      label = 'PUBLIC KEY'
    }
  }

  const encoder = new DEREncoder(model!)

  return encoding === 'der' ? encoder.der() : encoder.pem(label!)
}
