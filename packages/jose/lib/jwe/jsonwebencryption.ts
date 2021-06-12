import { Base64Url } from '@guarani/utils'

import {
  InvalidJoseHeader,
  InvalidJsonWebEncryption,
  JoseError
} from '../exceptions'
import { JsonWebKey } from '../jwk'
import { KeyLoader } from '../types'
import { JWE_ALGORITHMS, JWE_ENCRYPTIONS } from './algorithms'
import {
  JsonWebEncryptionHeader,
  JWEHeaderParams
} from './jsonwebencryption.header'

type JWEJoseHeader = JsonWebEncryptionHeader | JWEHeaderParams

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

  public static async deserializeCompact(
    token: string,
    wrapKey: JsonWebKey
  ): Promise<JsonWebEncryption>

  public static async deserializeCompact(
    token: string,
    wrapKey: KeyLoader
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

      const wrapKey =
        jwkOrKeyLoader instanceof JsonWebKey
          ? jwkOrKeyLoader
          : jwkOrKeyLoader(header)

      const cek = await alg.unwrap(enc, ek, wrapKey, header)
      const plaintext = enc.decrypt(ciphertext, aad, iv, tag, cek)

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

    const { cek, ek, header } = await alg.wrap(enc, wrapKey)
    const iv = enc.generateIV()

    if (header) {
      Object.assign(this.header, header)
    }

    const b64Header = Base64Url.encode(Buffer.from(JSON.stringify(this.header)))
    const aad = Buffer.from(b64Header, 'ascii')

    const { ciphertext, tag } = enc.encrypt(this.plaintext, aad, iv, cek)
    const b64IV = Base64Url.encode(iv)

    return `${b64Header}.${ek}.${b64IV}.${ciphertext}.${tag}`
  }
}
