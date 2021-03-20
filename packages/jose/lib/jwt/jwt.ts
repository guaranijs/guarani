import { Primitives } from '@guarani/utils'

import { InvalidJsonWebToken, JoseError } from '../exceptions'
import { JsonWebKey } from '../jwk'
import { createJWS, JoseHeaderParams, parseJWS } from '../jws'
import { Claims, ClaimsOptions, JsonWebTokenClaims } from './claims'

/**
 * Parameters regarding the decoding of a JSON Web Token.
 */
interface DecodeParams {
  /**
   * JSON Web Token to be decoded.
   */
  token: string

  /**
   * JSON Web Key used to decode the token.
   */
  key?: JsonWebKey

  /**
   * Expected algorithm of the token.
   */
  algorithm?: string

  /**
   * Validates the signature of the token.
   */
  validate?: boolean
}

/**
 * Options regarding the encoding of a JSON Web Token.
 */
interface EncodeParams {
  /**
   * JOSE Header containing the meta information of the token.
   */
  header: JoseHeaderParams

  /**
   * Object containing the claims of the token.
   */
  claims: JsonWebTokenClaims

  /**
   * JSON Web Key used to encode the token.
   */
  key?: JsonWebKey
}

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
 * The most common way of representing a **JSON Web Token** is through the
 * `JSON Web Signature Compact Serialization`, which gives a small token
 * that is digitally signed.
 *
 * The claims are represented via a JSON object that contains information about
 * an application, system or user. Since this information is digitally signed,
 * the receiver can then use the respective key to validate the token and can
 * thus trust that the information is legitimate.
 */
export interface JsonWebToken {
  /**
   * JOSE Header containing the meta information of the token.
   */
  header: JoseHeaderParams

  /**
   * Object representing the claims of the token.
   */
  claims: JsonWebTokenClaims
}

/**
 * Encodes the contents of a JsonWebToken.
 *
 * It encodes the header into a Base64Url version of its JSON representation,
 * and encodes the claims into a Base64Url format.
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
 * @param params - Object defining the encoding flow.
 * @returns Signed JSON Web Token.
 */
export function createJWT(params: EncodeParams): string {
  return createJWS({
    header: params.header,
    payload: Primitives.toBuffer(JSON.stringify(params.claims)),
    key: params.key
  })
}

/**
 * Decodes a JSON Web Token checking if its signature matches its content.
 *
 * Despite being optional, it is recommended to provide an algorithm
 * to prevent the `none attack` and the misuse of a public key as secret key.
 *
 * The algorithm specified at the header of the token
 * **MUST** match the provided algorithm, if any.
 *
 * @param params - Object defining the decoding flow.
 * @param options - Options for validating the token.
 * @returns JsonWebToken object containing the decoded header and claims.
 */
export function parseJWT(
  params: DecodeParams,
  options?: ClaimsOptions
): JsonWebToken {
  try {
    const { header, payload } = parseJWS(params)

    const claims: JsonWebTokenClaims = JSON.parse(
      Primitives.fromBuffer(payload, 'string')
    )

    // Validation of the claims.
    // eslint-disable-next-line no-new
    new Claims(claims, options)

    return { header, claims }
  } catch (error) {
    if (error instanceof JoseError) throw new InvalidJsonWebToken(error.message)

    throw new InvalidJsonWebToken()
  }
}
