import { Dict } from '@guarani/utils'

import {
  InvalidJoseHeader,
  InvalidJsonWebToken,
  InvalidJsonWebTokenClaim,
  JoseError
} from '../exceptions'
import { JoseHeader } from '../jose.header'
import { JsonWebEncryption, JsonWebEncryptionHeader } from '../jwe'
import { JsonWebKey } from '../jwk'
import { JsonWebSignature, JsonWebSignatureHeader } from '../jws'
import { DecodeOptions as JWSDecodeOptions } from '../jws/_types'
import { JsonWebTokenClaims } from './jsonwebtoken.claims'
import { JWTClaimOptions, JWTClaims } from './jwt-claims'

/**
 * Implementation of RFC 7519.
 *
 * The **JSON Web Token** is used for transporting claims over the network,
 * providing a signature that guarantees the integrity of the information.
 *
 * This implementation provides a set of attributes to represent the state
 * of the information, as well as segregating the header from the payload,
 * which in turn facilitates the use of any of them.
 *
 * It can be used with a **JSON Web Signature** or a **JSON Web Encryption**.
 *
 * The most common way of representing a **JSON Web Token** is through the
 * `JSON Web Signature Compact Serialization`, which gives a small token
 * that is digitally signed.
 *
 * The **JSON Web Token** can also be represented through the
 * `JSON Web Encryption Compact Serialization`, which encrypts the JWS Token,
 * providing confidentiality about the contents of the JSON Web Token.
 *
 * The claims are represented via a JSON object that contains information about
 * an application, system or user. Since this information is digitally signed,
 * the receiver can then use the respective key to validate the token and can
 * thus trust that the information is legitimate.
 */
export class JsonWebToken {
  /**
   * JOSE Header containing the meta information of the token.
   */
  public readonly header: JoseHeader

  /**
   * Object representing the claims of the token.
   */
  public readonly claims: JsonWebTokenClaims

  /**
   * Instantiates a new JSON Web Token based on the provided
   * JOSE Header and Claims.
   *
   * @param header - JWS JOSE Header containing the token's meta information.
   * @param claims - Claims represented by the JSON Web Token.
   */
  public constructor(header: JsonWebSignatureHeader, claims: JsonWebTokenClaims)

  /**
   * Instantiates a new JSON Web Token based on the provided
   * JOSE Header and Claims.
   *
   * @param header - JWE JOSE Header containing the token's meta information.
   * @param claims - Claims represented by the JSON Web Token.
   */
  public constructor(
    header: JsonWebEncryptionHeader,
    claims: JsonWebTokenClaims
  )

  public constructor(header: JoseHeader, claims: JsonWebTokenClaims) {
    if (!header) {
      throw new InvalidJoseHeader()
    }

    if (!claims) {
      throw new InvalidJsonWebTokenClaim()
    }

    this.header = header
    this.claims = claims
  }

  /**
   * Decodes a **JWS based JSON Web Token** checking if its signature
   * matches its content.
   *
   * Despite being optional, it is recommended to provide a **JWS Algorithm**
   * to prevent the `none attack` and the misuse of a public key as secret key.
   *
   * The algorithm specified at the header of the token
   * **MUST** match the provided algorithm, if any.
   *
   * If the JWS Algorithm `none` is expected, the JSON Web Key
   * can be **null** or **undefined**.
   *
   * @param token - JSON Web Token to be decoded.
   * @param key - JSON Web Key used to validate the signature of the Token.
   * @param decodeOptions - Options regarding the decoding of the Token.
   * @param claimsOptions - Validation options for the JWT Claims.
   * @returns JSON Web Token containing the decoded JWS JOSE Header and Claims.
   */
  public static async verify(
    token: string,
    key: JsonWebKey,
    decodeOptions?: JWSDecodeOptions,
    claimsOptions?: Dict<JWTClaimOptions>
  ): Promise<JsonWebToken> {
    if (token == null || typeof token !== 'string') {
      throw new InvalidJsonWebToken()
    }

    decodeOptions ??= {}
    claimsOptions ??= {}

    try {
      const { header, payload } = await JsonWebSignature.deserializeCompact(
        token,
        key,
        decodeOptions
      )

      const parsedClaims = <JWTClaims>JSON.parse(payload.toString('utf8'))
      const claims = new JsonWebTokenClaims(parsedClaims, claimsOptions)

      return new JsonWebToken(<JsonWebSignatureHeader>header, claims)
    } catch (error) {
      if (error instanceof InvalidJsonWebToken) {
        throw error
      }

      if (error instanceof JoseError) {
        throw new InvalidJsonWebToken(error.message)
      }

      throw new InvalidJsonWebToken()
    }
  }

  /**
   * Decodes a **JWE based JSON Web Token**.
   *
   * @param token - JSON Web Token to be decoded.
   * @param wrapKey - JSON Web Key used to unwrap the Encrypted Key.
   * @param claimsOptions - Validation options for the JWT Claims.
   * @returns JSON Web Token containing the decoded JWE JOSE Header and Claims.
   */
  public static async decrypt(
    token: string,
    wrapKey: JsonWebKey,
    claimsOptions?: Dict<JWTClaimOptions>
  ): Promise<JsonWebToken> {
    if (token == null || typeof token !== 'string') {
      throw new InvalidJsonWebToken()
    }

    claimsOptions ??= {}

    try {
      const { header, plaintext } = await JsonWebEncryption.deserializeCompact(
        token,
        wrapKey
      )

      const parsedClaims = <JWTClaims>JSON.parse(plaintext.toString('utf8'))
      const claims = new JsonWebTokenClaims(parsedClaims, claimsOptions)

      return new JsonWebToken(<JsonWebEncryptionHeader>header, claims)
    } catch (error) {
      if (error instanceof InvalidJsonWebToken) {
        throw error
      }

      if (error instanceof JoseError) {
        throw new InvalidJsonWebToken(error.message)
      }

      throw new InvalidJsonWebToken()
    }
  }

  /**
   * Serializes the contents of a JsonWebToken into a JWS Compact Token.
   *
   * It encodes the header and claims into a Base64Url version
   * of their JSON representation, allowing the compatibility
   * of the token in different systems.
   *
   * It creates a string message of the following format:
   *
   * `Base64Url(UTF-8(header)).Base64Url(UTF-8(claims))`
   *
   * It then signs the message using the provided key, and imbues the signature
   * into the message, resulting in the following token:
   *
   * `Base64Url(UTF-8(header)).Base64Url(UTF-8(claims)).Base64Url(signature)`
   *
   * The resulting token is then returned to the application.
   *
   * @param key - JSON Web Key used to sign the token.
   * @returns Resulting JWS based JSON Web Token.
   */
  public async sign(key?: JsonWebKey): Promise<string> {
    if (!(this.header instanceof JsonWebSignatureHeader)) {
      throw new InvalidJoseHeader('The JOSE Header is not a JWS JOSE Header.')
    }

    const payload = Buffer.from(JSON.stringify(this.claims))
    const jws = new JsonWebSignature(this.header, payload)

    return await jws.serializeCompact(key)
  }

  /**
   * Serializes the contents of a JsonWebToken into a JWE Compact Token.
   *
   * The JWE's Ciphertext is the encrypted Buffer representation of the
   * JSON representation of the JWT Claims.
   *
   * It encodes the header into a Base64Url version of its JSON representation,
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
   * @returns Resulting JWE based JSON Web Token.
   */
  public async encrypt(wrapKey?: JsonWebKey): Promise<string> {
    if (!(this.header instanceof JsonWebEncryptionHeader)) {
      throw new InvalidJoseHeader('The JOSE Header is not a JWE JOSE Header.')
    }

    const plaintext = Buffer.from(JSON.stringify(this.claims))
    const jwe = new JsonWebEncryption(this.header, plaintext)

    return await jwe.serializeCompact(wrapKey)
  }
}
