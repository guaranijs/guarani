import {
  Decoder,
  DERDecoder,
  DEREncoder,
  Integer,
  Node,
  PEMDecoder,
  PEMEncoder
} from '@guarani/asn1'
import { Base64Url } from '@guarani/utils'

import {
  createPrivateKey,
  createPublicKey,
  generateKeyPair,
  KeyObject
} from 'crypto'
import { promisify } from 'util'

import { InvalidKey } from '../../../exceptions'
import { JsonWebKey, JsonWebKeyParams } from '../../jsonwebkey'
import {
  decodePrivatePkcs1,
  decodePrivatePkcs8,
  encodePrivatePkcs1,
  encodePrivatePkcs8
} from './_private'
import {
  decodePublicPkcs1,
  decodePublicX509,
  encodePublicPkcs1,
  encodePublicX509
} from './_public'

const generateKeyPairAsync = promisify(generateKeyPair)

/**
 * Representation of the parameters of an **RSA Key**.
 */
export interface RsaKeyParams extends JsonWebKeyParams {
  /**
   * Base64Url representation of the Modulus.
   */
  readonly n: string

  /**
   * Base64Url representation of the Public Exponent.
   */
  readonly e: string

  /**
   * Base64Url representation of the Private Exponent.
   */
  readonly d?: string

  /**
   * Base64Url representation of the First Prime.
   */
  readonly p?: string

  /**
   * Base64Url representation of the Second Prime.
   */
  readonly q?: string

  /**
   * Base64Url representation of the CRT's First Exponent.
   */
  readonly dp?: string

  /**
   * Base64Url representation of the CRT's Second Exponent.
   */
  readonly dq?: string

  /**
   * Base64Url representation of the CRT's Coefficient.
   */
  readonly qi?: string

  /**
   * Base64Url representation of the Other Primes.
   */
  readonly oth?: [string?, string?, string?]
}

/**
 * Implementation of the RSA Key.
 */
export class RsaKey extends JsonWebKey implements RsaKeyParams {
  /**
   * Key type representing the algorithm of the key.
   */
  public readonly kty: string

  /**
   * Base64Url representation of the Modulus.
   */
  public readonly n: string

  /**
   * Base64Url representation of the Public Exponent.
   */
  public readonly e: string

  /**
   * Base64Url representation of the Private Exponent.
   */
  public readonly d?: string

  /**
   * Base64Url representation of the First Prime.
   */
  public readonly p?: string

  /**
   * Base64Url representation of the Second Prime.
   */
  public readonly q?: string

  /**
   * Base64Url representation of the CRT's First Exponent.
   */
  public readonly dp?: string

  /**
   * Base64Url representation of the CRT's Second Exponent.
   */
  public readonly dq?: string

  /**
   * Base64Url representation of the CRT's Coefficient.
   */
  public readonly qi?: string

  /**
   * Base64Url representation of the Other Primes.
   */
  public readonly oth?: [string?, string?, string?]

  /**
   * Instantiantes a new RSA Key based on the provided parameters.
   *
   * @param key - Parameters of the key.
   * @param options - Optional JSON Web Key Parameters.
   */
  public constructor(key: RsaKeyParams, options: JsonWebKeyParams = {}) {
    const params: RsaKeyParams = { ...key, ...options }

    super(params)

    if (params.kty && params.kty !== 'RSA') {
      throw new InvalidKey(
        `Invalid parameter "kty". Expected "RSA", got "${params.kty}".`
      )
    }

    if (!params.n || typeof params.n !== 'string') {
      throw new InvalidKey('Invalid parameter "n".')
    }

    if (Base64Url.bufferLength(params.n) < 256) {
      throw new InvalidKey('The modulus MUST have AT LEAST 2048 bits.')
    }

    if (!params.e || typeof params.e !== 'string') {
      throw new InvalidKey('Invalid parameter "e".')
    }

    this.kty = 'RSA'
    this.n = params.n
    this.e = params.e

    if (params.d != null) {
      if (!params.d || typeof params.d !== 'string') {
        throw new InvalidKey('Invalid parameter "d".')
      }

      if (!params.p || typeof params.p !== 'string') {
        throw new InvalidKey('Invalid parameter "p".')
      }

      if (!params.q || typeof params.q !== 'string') {
        throw new InvalidKey('Invalid parameter "q".')
      }

      if (!params.dp || typeof params.dp !== 'string') {
        throw new InvalidKey('Invalid parameter "dp".')
      }

      if (!params.dq || typeof params.dq !== 'string') {
        throw new InvalidKey('Invalid parameter "dq".')
      }

      if (!params.qi || typeof params.qi !== 'string') {
        throw new InvalidKey('Invalid parameter "qi".')
      }

      this.d = params.d
      this.p = params.p
      this.q = params.q
      this.dp = params.dp
      this.dq = params.dq
      this.qi = params.qi
    }
  }

  /**
   * Returns an instance of the NodeJS native Public Key.
   *
   * @returns Native Public Key Object.
   */
  private get publicKey(): KeyObject {
    return createPublicKey(this.export('public', 'pem', 'pkcs1'))
  }

  /**
   * Returns an instance of the NodeJS native private key.
   *
   * @returns Native Private Key Object.
   */
  private get privateKey(): KeyObject {
    return createPrivateKey(this.export('private', 'pem', 'pkcs1'))
  }

  /**
   * Creates a new RSA Key.
   *
   * @param modulus - Length of the Modulus of the Key in bits.
   * @param options - Optional JSON Web Key Parameters.
   * @returns Instance of an RsaKey.
   */
  public static async generate(
    modulus: number,
    options?: JsonWebKeyParams
  ): Promise<RsaKey> {
    if (!Number.isInteger(modulus)) {
      throw new InvalidKey('Invalid modulus length.')
    }

    if (modulus < 2048) {
      throw new InvalidKey('The modulus MUST be AT LEAST 2048 bits long.')
    }

    const { privateKey } = await generateKeyPairAsync('rsa', {
      modulusLength: modulus,
      publicExponent: 0x10001
    })

    const der = privateKey.export({ format: 'der', type: 'pkcs1' })
    const decoder = DERDecoder(der).sequence()

    // Removes the version.
    decoder.integer()

    return decodePrivatePkcs1(decoder, options)
  }

  /**
   * Parses a DER encoded RSA Key.
   *
   * @param der - DER representation of the RSA Key.
   * @param options - Optional JSON Web Key Parameters.
   * @returns Instance of an RsaKey.
   */
  public static parse(der: Buffer, options?: JsonWebKeyParams): RsaKey

  /**
   * Parses a PEM encoded RSA Key.
   *
   * @param pem - PEM representation of the RSA Key.
   * @param options - Optional JSON Web Key Parameters.
   * @returns Instance of an RsaKey.
   */
  public static parse(pem: string, options?: JsonWebKeyParams): RsaKey

  public static parse(
    data: Buffer | string,
    options?: JsonWebKeyParams
  ): RsaKey {
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

    // Private Key.
    if (!Buffer.compare(decoder.data.slice(0, 3), new Integer(0x00).encode())) {
      // Removes the version.
      decoder.integer()

      try {
        try {
          return decodePrivatePkcs1(decoder, options)
        } catch {
          return decodePrivatePkcs8(decoder, options)
        }
      } catch {
        throw new InvalidKey('Could not parse the provided key.')
      }
    } else {
      try {
        try {
          return decodePublicPkcs1(decoder, options)
        } catch {
          return decodePublicX509(decoder, options)
        }
      } catch {
        throw new InvalidKey('Could not parse the provided key.')
      }
    }
  }

  /**
   * Returns a DER representation of the Public Key
   * that only contains the parameters of the Key.
   *
   * @param key - Defines the encoding of the Public Key.
   * @param format - Format of the exported key.
   * @param type - ASN.1 Syntax Tree representation of the Public Key.
   * @returns DER encoded PKCS#1 RSA Public Key.
   *
   * @example
   * ```
   * > const pkcs1 = key.export('public', 'der', 'pkcs1')
   * > pkcs1
   * <Buffer 30 82 01 0a 02 82 01 01 00 c6 3a 45 c9 dc d3 ... 255 more bytes>
   * ```
   */
  public export(key: 'public', format: 'der', type: 'pkcs1'): Buffer

  /**
   * Returns a DER representation of the Public Key enveloped
   * in an X.509 SubjectPublicKeyInfo containing the Modulus
   * and the Public Exponent of the Key.
   *
   * @param key - Defines the encoding of the Public Key.
   * @param format - Format of the exported key.
   * @param type - ASN.1 Syntax Tree representation of the Public Key.
   * @returns DER encoded SPKI RSA Public Key.
   *
   * @example
   * ```
   * > const x509 = key.export('public', 'der', 'x509')
   * > x509
   * <Buffer 30 82 01 22 30 0d 06 09 2a 86 48 86 f7 0d 01 ... 279 more bytes>
   * ```
   */
  public export(key: 'public', format: 'der', type: 'x509'): Buffer

  /**
   * Returns a PEM representation of the Public Key
   * that only contains the parameters of the Key.
   *
   * @param key - Defines the encoding of the Public Key.
   * @param format - Format of the exported key.
   * @param type - ASN.1 Syntax Tree representation of the Public Key.
   * @returns PEM encoded PKCS#1 RSA Public Key.
   *
   * @example
   * ```
   * > const pkcs1 = key.export('public', 'pem', 'pkcs1')
   * > pkcs1
   * '-----BEGIN RSA PUBLIC KEY-----\n' +
   * '<Base64 representation...>\n' +
   * '-----END RSA PUBLIC KEY-----\n'
   * ```
   */
  public export(key: 'public', format: 'pem', type: 'pkcs1'): string

  /**
   * Returns a PEM representation of the Public Key enveloped
   * in an X.509 SubjectPublicKeyInfo containing the Modulus
   * and the Public Exponent of the Key.
   *
   * @param key - Defines the encoding of the Public Key.
   * @param format - Format of the exported key.
   * @param type - ASN.1 Syntax Tree representation of the Public Key.
   * @returns PEM encoded SPKI RSA Public Key.
   *
   * @example
   * ```
   * > const x509 = key.export('public', 'pem', 'x509')
   * > x509
   * '-----BEGIN PUBLIC KEY-----\n' +
   * '<Base64 representation...>\n' +
   * '-----END PUBLIC KEY-----\n'
   * ```
   */
  public export(key: 'public', format: 'pem', type: 'x509'): string

  /**
   * Returns a DER representation of the Private Key
   * that only contains the parameters of the Key.
   *
   * @param key - Defines the encoding of the Private Key.
   * @param format - Format of the exported key.
   * @param type - ASN.1 Syntax Tree representation of the Private Key.
   * @returns DER encoded PKCS#1 RSA Private Key.
   *
   * @example
   * ```
   * > const pkcs1 = key.export('private', 'der', 'pkcs1')
   * > pkcs1
   * <Buffer 30 82 04 a4 02 01 00 02 82 01 01 00 c6 3a 45 ... 1177 more bytes>
   * ```
   */
  public export(key: 'private', format: 'der', type: 'pkcs1'): Buffer

  /**
   * Returns a DER representation of the Private Key enveloped
   * in a PKCS#8 object containing all the parameters of the key.
   *
   * @param key - Defines the encoding of the Private Key.
   * @param format - Format of the exported key.
   * @param type - ASN.1 Syntax Tree representation of the Private Key.
   * @returns DER encoded PKCS#8 RSA Private Key.
   *
   * @example
   * ```
   * > const pkcs8 = key.export('private', 'der', 'pkcs8')
   * > pkcs8
   * <Buffer 30 82 04 be 02 01 00 30 0d 06 09 2a 86 48 86 ... 1203 more bytes>
   * ```
   */
  public export(key: 'private', format: 'der', type: 'pkcs8'): Buffer

  /**
   * Returns a PEM representation of the Private Key
   * that only contains the parameters of the Key.
   *
   * @param key - Defines the encoding of the Private Key.
   * @param format - Format of the exported key.
   * @param type - ASN.1 Syntax Tree representation of the Private Key.
   * @returns PEM encoded PKCS#1 RSA Private Key.
   *
   * @example
   * ```
   * > const pkcs1 = key.export('private', 'pem', 'pkcs1')
   * > pkcs1
   * '-----BEGIN RSA PRIVATE KEY-----\n' +
   * '<Base64 representation...>\n' +
   * '-----END RSA PRIVATE KEY-----\n'
   * ```
   */
  public export(key: 'private', format: 'pem', type: 'pkcs1'): string

  /**
   * Returns a PEM representation of the Private Key enveloped
   * in a PKCS#8 object containing all the parameters of the key.
   *
   * @param key - Defines the encoding of the Private Key.
   * @param format - Format of the exported key.
   * @param type - ASN.1 Syntax Tree representation of the Private Key.
   * @returns PEM encoded PKCS#8 RSA Private Key.
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
    type: 'pkcs1' | 'pkcs8' | 'x509'
  ): Buffer | string {
    if (key !== 'public' && key !== 'private') {
      throw new TypeError('Invalid parameter "key".')
    }

    if (format !== 'der' && format !== 'pem') {
      throw new TypeError('Invalid parameter "format".')
    }

    if (
      (key === 'public' && type !== 'pkcs1' && type !== 'x509') ||
      (key === 'private' && type !== 'pkcs1' && type !== 'pkcs8')
    ) {
      throw new TypeError('Invalid parameter "type".')
    }

    let root: Node, label: string

    if (key === 'public') {
      if (type === 'pkcs1') {
        root = encodePublicPkcs1(this)
        label = 'RSA PUBLIC KEY'
      }

      if (type === 'x509') {
        root = encodePublicX509(this)
        label = 'PUBLIC KEY'
      }
    }

    if (key === 'private') {
      if (type === 'pkcs1') {
        root = encodePrivatePkcs1(this)
        label = 'RSA PRIVATE KEY'
      }

      if (type === 'pkcs8') {
        root = encodePrivatePkcs8(this)
        label = 'PRIVATE KEY'
      }
    }

    return format === 'der' ? DEREncoder(root) : PEMEncoder(root, label)
  }
}
