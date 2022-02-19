import {
  Decoder,
  DERDecoder,
  DEREncoder,
  Node,
  PEMDecoder,
  PEMEncoder
} from '@guarani/asn1'

import { generateKeyPair } from 'crypto'
import { promisify } from 'util'

import { InvalidKey } from '../../../exceptions'
import { JsonWebKey, JsonWebKeyParams } from '../../jsonwebkey'
import {
  decodePrivatePkcs8,
  decodePrivateSec1,
  encodePrivatePkcs8,
  encodePrivateSec1
} from './_private'
import { decodePublicX509, encodePublicX509 } from './_public'
import { ELLIPTIC_CURVES, SupportedEllipticCurve } from './_types'

const generateKeyPairAsync = promisify(generateKeyPair)

/**
 * Representation of the parameters of an **Elliptic Curve Key**.
 */
export interface EcKeyParams extends JsonWebKeyParams {
  /**
   * Name of the elliptic curve.
   */
  readonly crv: SupportedEllipticCurve

  /**
   * Base64Url representation of the X value.
   */
  readonly x: string

  /**
   * Base64Url representation of the Y value.
   */
  readonly y: string

  /**
   * Base64Url representation of the Private Value.
   */
  readonly d?: string
}

/**
 * Implementation of the Elliptic Curve Key.
 */
export class EcKey extends JsonWebKey implements EcKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  public readonly kty: string

  /**
   * Name of the elliptic curve.
   */
  public readonly crv: SupportedEllipticCurve

  /**
   * Base64Url representation of the X value.
   */
  public readonly x: string

  /**
   * Base64Url representation of the Y value.
   */
  public readonly y: string

  /**
   * Base64Url representation of the Private Value.
   */
  public readonly d?: string

  /**
   * Instantiantes a new Elliptic Curve Key based on the provided parameters.
   *
   * @param key Parameters of the key.
   * @param options Optional JSON Web Key Parameters.
   */
  public constructor(key: EcKeyParams, options: JsonWebKeyParams = {}) {
    const params: EcKeyParams = { ...key, ...options }

    super(params)

    if (params.kty && params.kty !== 'EC') {
      throw new InvalidKey(
        `Invalid parameter "kty". Expected "EC", got "${params.kty}".`
      )
    }

    if (!(params.crv in ELLIPTIC_CURVES)) {
      throw new InvalidKey(`Unsupported curve "${params.crv}".`)
    }

    if (!params.x || typeof params.x !== 'string') {
      throw new InvalidKey('Invalid parameter "x".')
    }

    if (!params.y || typeof params.y !== 'string') {
      throw new InvalidKey('Invalid parameter "y".')
    }

    this.kty = 'EC'
    this.crv = params.crv
    this.x = params.x
    this.y = params.y

    if (params.d != null) {
      if (!params.d || typeof params.d !== 'string') {
        throw new InvalidKey('Invalid parameter "d".')
      }

      this.d = params.d
    }
  }

  /**
   * Creates a new Elliptic Curve Key.
   *
   * @param curve Name of the Elliptic Curve.
   * @param options Optional JSON Web Key Parameters.
   * @returns Instance of an EcKey.
   */
  public static async generate(
    curve: SupportedEllipticCurve,
    options?: JsonWebKeyParams
  ): Promise<EcKey> {
    if (!(curve in ELLIPTIC_CURVES)) {
      throw new TypeError(`Unsupported curve "${curve}".`)
    }

    const curveMeta = ELLIPTIC_CURVES[curve]

    const { privateKey } = await generateKeyPairAsync('ec', {
      namedCurve: curveMeta.name
    })

    const der = privateKey.export({ format: 'der', type: 'sec1' })
    const decoder = DERDecoder(der).sequence()

    // Removes the version.
    decoder.integer()

    return decodePrivateSec1(decoder, options)
  }

  /**
   * Parses a DER encoded Elliptic Curve Key.
   *
   * @param der DER representation of the Elliptic Curve Key.
   * @param options Optional JSON Web Key Parameters.
   * @returns Instance of an EcKey.
   */
  public static parse(der: Buffer, options?: JsonWebKeyParams): EcKey

  /**
   * Parses a PEM encoded Elliptic Curve Key.
   *
   * @param pem PEM representation of the Elliptic Curve Key.
   * @param options Optional JSON Web Key Parameters.
   * @returns Instance of an EcKey.
   */
  public static parse(pem: string, options?: JsonWebKeyParams): EcKey

  public static parse(
    data: Buffer | string,
    options?: JsonWebKeyParams
  ): EcKey {
    if (!data || (!Buffer.isBuffer(data) && typeof data !== 'string')) {
      throw new TypeError('Invalid Key Data.')
    }

    let decoder: Decoder

    try {
      if (Buffer.isBuffer(data)) {
        decoder = DERDecoder(data).sequence()
      } else {
        decoder = PEMDecoder(data).sequence()
      }
    } catch {
      throw new InvalidKey('Could not parse the provided key.')
    }

    try {
      return decodePublicX509(decoder, options)
    } catch {
      try {
        const version = decoder.integer()

        if (version === 0x01n) {
          return decodePrivateSec1(decoder, options)
        }

        if (version === 0x00n) {
          return decodePrivatePkcs8(decoder, options)
        }
      } catch {
        throw new InvalidKey('Could not parse the provided key.')
      }
    }

    throw new InvalidKey('Could not parse the provided key.')
  }

  /**
   * Returns a DER representation of the Public Key enveloped
   * in an X.509 SubjectPublicKeyInfo containing the Modulus
   * and the Public Exponent of the Key.
   *
   * @param key Defines the encoding of the Public Key.
   * @param format Format of the exported key.
   * @returns DER encoded SPKI Elliptic Curve Public Key.
   *
   * @example
   * ```
   * > const spki = key.export('public', 'der')
   * > spki
   * <Buffer 30 59 30 13 06 07 2a 86 48 ce 3d 02 01 06 08 ... 76 more bytes>
   * ```
   */
  public export(key: 'public', format: 'der'): Buffer

  /**
   * Returns a PEM representation of the Public Key enveloped
   * in an X.509 SubjectPublicKeyInfo containing the Modulus
   * and the Public Exponent of the Key.
   *
   * @param key Defines the encoding of the Public Key.
   * @param format Format of the exported key.
   * @returns PEM encoded SPKI Elliptic Curve Public Key.
   *
   * @example
   * ```
   * > const spki = key.export('public', 'pem')
   * > spki
   * '-----BEGIN PUBLIC KEY-----\n' +
   * '<Base64 representation...>\n' +
   * '-----END PUBLIC KEY-----\n'
   * ```
   */
  public export(key: 'public', format: 'pem'): string

  /**
   * Returns a DER representation of the Private Key
   * that only contains the parameters of the Key.
   *
   * @param key Defines the encoding of the Private Key.
   * @param format Format of the exported key.
   * @param type ASN.1 Syntax Tree representation of the Private Key.
   * @returns DER encoded SEC.1 Elliptic Curve Private Key.
   *
   * @example
   * ```
   * > const sec1 = key.export('private', 'der', 'sec1')
   * > sec1
   * <Buffer 30 77 02 01 01 04 20 6f 05 57 e9 5c 7e 4c e7 ... 106 more bytes>
   * ```
   */
  public export(key: 'private', format: 'der', type: 'sec1'): Buffer

  /**
   * Returns a DER representation of the Private Key enveloped
   * in a PKCS#8 object containing all the parameters of the key.
   *
   * @param key Defines the encoding of the Private Key.
   * @param format Format of the exported key.
   * @param type ASN.1 Syntax Tree representation of the Private Key.
   * @returns DER encoded PKCS#8 Elliptic Curve Private Key.
   *
   * @example
   * ```
   * > const pkcs8 = key.export('private', 'der', 'pkcs8')
   * > pkcs8
   * <Buffer 30 81 87 02 01 00 30 13 06 07 2a 86 48 ce 3d ... 123 more bytes>
   * ```
   */
  public export(key: 'private', format: 'der', type: 'pkcs8'): Buffer

  /**
   * Returns a PEM representation of the Private Key
   * that only contains the parameters of the Key.
   *
   * @param key Defines the encoding of the Private Key.
   * @param format Format of the exported key.
   * @param type ASN.1 Syntax Tree representation of the Private Key.
   * @returns PEM encoded SEC.1 Elliptic Curve Private Key.
   *
   * @example
   * ```
   * > const sec1 = key.export('private', 'pem', 'sec1')
   * > sec1
   * '-----BEGIN EC PRIVATE KEY-----\n' +
   * '<Base64 representation...>\n' +
   * '-----END EC PRIVATE KEY-----\n'
   * ```
   */
  public export(key: 'private', format: 'pem', type: 'sec1'): string

  /**
   * Returns a PEM representation of the Private Key enveloped
   * in a PKCS#8 object containing all the parameters of the key.
   *
   * @param key Defines the encoding of the Private Key.
   * @param format Format of the exported key.
   * @param type ASN.1 Syntax Tree representation of the Private Key.
   * @returns PEM encoded PKCS#8 Elliptic Curve Private Key.
   *
   * @example
   * ```
   * > const pkcs8 = key.export('private', 'pem', 'pkcs8')
   * > pkcs8
   * '-----BEGIN PRIVATE KEY-----\n' +
   * '<Base64 representation...>\n' +
   * '-----END PRIVATE KEY-----\n'
   * ```
   */
  public export(key: 'private', format: 'pem', type: 'pkcs8'): string

  public export(
    key: 'public' | 'private',
    format: 'der' | 'pem',
    type?: 'sec1' | 'pkcs8'
  ): Buffer | string {
    if (key !== 'public' && key !== 'private') {
      throw new TypeError('Invalid parameter "key".')
    }

    if (format !== 'der' && format !== 'pem') {
      throw new TypeError('Invalid parameter "format".')
    }

    if (key === 'private' && type !== 'sec1' && type !== 'pkcs8') {
      throw new TypeError('Invalid parameter "type".')
    }

    let root: Node, label: string

    if (key === 'public') {
      root = encodePublicX509(this)
      label = 'PUBLIC KEY'
    }

    if (key === 'private') {
      if (type === 'sec1') {
        root = encodePrivateSec1(this)
        label = 'EC PRIVATE KEY'
      }

      if (type === 'pkcs8') {
        root = encodePrivatePkcs8(this)
        label = 'PRIVATE KEY'
      }
    }

    return format === 'der' ? DEREncoder(root!) : PEMEncoder(root!, label!)
  }
}
