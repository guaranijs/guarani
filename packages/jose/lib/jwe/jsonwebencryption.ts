import { Base64Url } from '@guarani/utils'

import {
  InvalidJoseHeader,
  InvalidJsonWebEncryption,
  JoseError
} from '../exceptions'
import { JsonWebKey } from '../jwk'
import { KeyLoader } from '../types'
import {
  JWECompression,
  JWE_ALGORITHMS,
  JWE_COMPRESSIONS,
  JWE_ENCRYPTIONS
} from './algorithms'
import {
  JsonWebEncryptionHeader,
  JWEHeaderParams
} from './jsonwebencryption.header'

type JWEJoseHeader = JsonWebEncryptionHeader | JWEHeaderParams

/**
 * Implementation of RFC 7516.
 *
 * The **JSON Web Encryption** is used for transporting encrypted data
 * on the network, providing confidentiality of the information.
 *
 * This implementation provides a set of attributes to represent the state
 * of the information, as well as segregating the header from the payload,
 * which in turn facilitates the use of any of them.
 */
export class JsonWebEncryption {
  /**
   * JOSE Header containing the meta information of the token.
   */
  public readonly header: JsonWebEncryptionHeader

  /**
   * Buffer representation of the plaintext to be encrypted.
   */
  public readonly plaintext: Buffer

  /**
   * Instantiates a new JSON Web Encryption based on the provided
   * JWE JOSE Header and plaintext.
   *
   * @param header - JWE JOSE Header containing the token's meta information.
   * @param plaintext - Buffer representation of the plaintext to be encrypted.
   */
  public constructor(header: JsonWebEncryptionHeader, plaintext: Buffer)

  /**
   * Instantiates a new JSON Web Encryption based on the provided
   * JWE JOSE Header and plaintext.
   *
   * @param header - JWE JOSE Header containing the token's meta information.
   * @param plaintext - Buffer representation of the plaintext to be encrypted.
   */
  public constructor(header: JWEHeaderParams, plaintext: Buffer)

  public constructor(header: JWEJoseHeader, plaintext: Buffer) {
    if (!header) {
      throw new InvalidJoseHeader()
    }

    if (!Buffer.isBuffer(plaintext)) {
      throw new TypeError('The provided plaintext is invalid.')
    }

    this.header = new JsonWebEncryptionHeader(header)
    this.plaintext = plaintext
  }

  /**
   * Decodes a **JSON Web Encryption Compact Token**.
   *
   * @param token - JSON Web Encryption Compact Token to be decoded.
   * @param wrapKey - JSON Web Key used to unwrap the Encrypted Key.
   * @returns JSON Web Encryption containing the decoded JOSE Header and Plaintext.
   */
  public static async deserializeCompact(
    token: string,
    wrapKey: JsonWebKey
  ): Promise<JsonWebEncryption>

  /**
   * Decodes a **JSON Web Encryption Compact Token**.
   *
   * @param token - JSON Web Encryption Compact Token to be decoded.
   * @param keyLoader - Function used to load a JWK based on the JOSE Header.
   * @returns JSON Web Encryption containing the decoded JOSE Header and Plaintext.
   */
  public static async deserializeCompact(
    token: string,
    keyLoader: KeyLoader
  ): Promise<JsonWebEncryption>

  public static async deserializeCompact(
    token: string,
    jwkOrKeyLoader: JsonWebKey | KeyLoader
  ): Promise<JsonWebEncryption> {
    if (token == null || typeof token !== 'string') {
      throw new InvalidJsonWebEncryption()
    }

    const splitToken = token.split('.')

    if (splitToken.length !== 5) {
      throw new InvalidJsonWebEncryption()
    }

    try {
      const [b64Header, b64Ek, b64Iv, b64Ciphertext, b64Tag] = splitToken

      const decodedHeader = Base64Url.decode(b64Header)
      const parsedHeader = JSON.parse(decodedHeader.toString('utf8'))

      const header = new JsonWebEncryptionHeader(parsedHeader)
      const ek = Base64Url.decode(b64Ek)
      const iv = Base64Url.decode(b64Iv)
      const ciphertext = Base64Url.decode(b64Ciphertext)
      const tag = Base64Url.decode(b64Tag)
      const aad = Buffer.from(b64Header, 'ascii')

      const alg = JWE_ALGORITHMS[header.alg]
      const enc = JWE_ENCRYPTIONS[header.enc]
      const zip = <JWECompression>JWE_COMPRESSIONS[header.zip]

      const wrapKey =
        typeof jwkOrKeyLoader === 'function'
          ? jwkOrKeyLoader(header)
          : jwkOrKeyLoader

      if (wrapKey != null && !(wrapKey instanceof JsonWebKey)) {
        throw new InvalidJsonWebEncryption('Invalid key.')
      }

      const cek = await alg.unwrap(ek, wrapKey, header)
      let plaintext = await enc.decrypt(ciphertext, aad, iv, tag, cek)

      if (zip != null) {
        plaintext = await zip.decompress(plaintext)
      }

      return new JsonWebEncryption(header, plaintext)
    } catch (error) {
      if (error instanceof InvalidJsonWebEncryption) {
        throw error
      }

      if (error instanceof JoseError) {
        throw new InvalidJsonWebEncryption(error.message)
      }

      throw new InvalidJsonWebEncryption()
    }
  }

  /**
   * Serializes the contents of a JsonWebEncryption into a JWE Compact Token.
   *
   * It encodes the Header into a Base64Url version of its JSON representation,
   * and encodes the Encrypted Key, Initialization Vector, Ciphertext and
   * Authentication Tag into a Base64Url format, allowing the compatibility
   * in different systems.
   *
   * It creates a string message of the following format
   * (with break lines for display purposes only):
   *
   * `
   * Base64Url(UTF-8(header)).
   * Base64Url(Encrypted Key).
   * Base64Url(Initialization Vector).
   * Base64Url(Ciphertext).
   * Base64Url(Authentication Tag)
   * `
   *
   * The resulting token is then returned to the application.
   *
   * @param wrapKey - JSON Web Key used to wrap the Content Encryption Key.
   * @returns JSON Web Encryption Compact Token.
   */
  public async serializeCompact(wrapKey?: JsonWebKey): Promise<string> {
    if (this.header == null) {
      throw new InvalidJoseHeader(
        'This JSON Web Encryption cannot be serialized ' +
          'using the JWE Compact Serialization.'
      )
    }

    if (wrapKey == null && this.header.alg !== 'dir') {
      throw new InvalidJoseHeader(
        `The algorithm "${this.header.alg}" requires the use of a JSON Web Key.`
      )
    }

    const alg = JWE_ALGORITHMS[this.header.alg]
    const enc = JWE_ENCRYPTIONS[this.header.enc]
    const zip = <JWECompression>JWE_COMPRESSIONS[this.header.zip]

    const cek = enc.generateCEK()
    const iv = enc.generateIV()

    const { ek, header } = await alg.wrap(cek, wrapKey)

    if (header) {
      Object.assign(this.header, header)
    }

    const b64Header = Base64Url.encode(Buffer.from(JSON.stringify(this.header)))
    const aad = Buffer.from(b64Header, 'ascii')

    const plaintext =
      zip != null ? await zip.compress(this.plaintext) : this.plaintext

    const { ciphertext, tag } = await enc.encrypt(plaintext, aad, iv, cek)
    const b64IV = Base64Url.encode(iv)

    return `${b64Header}.${ek}.${b64IV}.${ciphertext}.${tag}`
  }
}
