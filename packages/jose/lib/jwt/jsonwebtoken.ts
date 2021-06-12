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

  public constructor(header: JsonWebSignatureHeader, claims: JsonWebTokenClaims)

  public constructor(
    header: JsonWebSignatureHeader,
    claims: JWTClaims,
    options?: Dict<JWTClaimOptions>
  )

  public constructor(
    header: JsonWebEncryptionHeader,
    claims: JsonWebTokenClaims
  )

  public constructor(
    header: JsonWebEncryptionHeader,
    claims: JWTClaims,
    options?: Dict<JWTClaimOptions>
  )

  public constructor(
    header: JoseHeader,
    claims: JsonWebTokenClaims | JWTClaims,
    options?: Dict<JWTClaimOptions>
  ) {
    if (!header) {
      throw new InvalidJoseHeader()
    }

    if (!claims) {
      throw new InvalidJsonWebTokenClaim()
    }

    this.header = header
    this.claims = new JsonWebTokenClaims(claims, options)
  }

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

  public async sign(key?: JsonWebKey): Promise<string> {
    if (!(this.header instanceof JsonWebSignatureHeader)) {
      throw new InvalidJoseHeader('The JOSE Header is not a JWS JOSE Header.')
    }

    const payload = Buffer.from(JSON.stringify(this.claims))
    const jws = new JsonWebSignature(this.header, payload)

    return await jws.serializeCompact(key)
  }

  public async encrypt(wrapKey?: JsonWebKey): Promise<string> {
    if (!(this.header instanceof JsonWebEncryptionHeader)) {
      throw new InvalidJoseHeader('The JOSE Header is not a JWE JOSE Header.')
    }

    const plaintext = Buffer.from(JSON.stringify(this.claims))
    const jwe = new JsonWebEncryption(this.header, plaintext)

    return await jwe.serializeCompact(wrapKey)
  }
}
