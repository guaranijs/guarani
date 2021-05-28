import { Base64Url } from '@guarani/utils'

import { InvalidJsonWebSignature, JoseError } from '../exceptions'
import { JsonWebKey } from '../jwk'
import { JoseHeader, JoseHeaderParams } from './header'

/**
 * Parameters regarding the decoding of a JSON Web Signature Token.
 */
interface DecodeParams {
  /**
   * JSON Web Signature Token to be decoded.
   */
  readonly token: string

  /**
   * JSON Web Key used to decode the token.
   */
  readonly key?: JsonWebKey

  /**
   * Expected algorithm of the token.
   */
  readonly algorithm?: string

  /**
   * Validates the signature of the token.
   */
  readonly validate?: boolean
}

/**
 * Parameters regarding the encoding of a JSON Web Signature Token.
 */
interface EncodeParams {
  /**
   * JOSE Header containing the meta information of the token.
   */
  readonly header: JoseHeaderParams

  /**
   * Buffer representation of the payload of the token.
   */
  readonly payload: Buffer

  /**
   * JSON Web Key used to encode the token.
   */
  readonly key?: JsonWebKey
}

/**
 * Implementation of RFC 7515.
 *
 * The **JSON Web Signature** is used for transporting data on the network,
 * providing a signature that guarantees the integrity of the information.
 *
 * This implementation provides a set of attributes to represent the state
 * of the information, as well as segregating the header from the payload,
 * which in turn facilitates the use of any of them.
 *
 * It provides an algorithm attribute as well. The algorithm is used to sign
 * and verify the data of the **JSON Web Signature**.
 */
export interface JsonWebSignature {
  /**
   * JOSE Header containing the meta information of the token.
   */
  readonly header: JoseHeaderParams

  /**
   * Buffer representation of the payload of the token.
   */
  readonly payload: Buffer
}

/**
 * Encodes the contents of a JsonWebSignature.
 *
 * It encodes the header into a Base64Url version of its JSON representation,
 * and encodes the payload into a Base64Url format, allowing the compatibility
 * of the payload in different systems.
 *
 * It creates a string message of the following format:
 *
 * `Base64Url(UTF-8(header)).Base64Url(payload)`
 *
 * It then signs the message using the provided key, and imbues the signature
 * into the message, resulting in the following token:
 *
 * `Base64Url(UTF-8(header)).Base64Url(payload).Base64Url(signature)`
 *
 * The resulting token is then returned to the application.
 *
 * @param params - Object defining the encoding flow.
 * @returns Signed JSON Web Signature Token.
 */
export function createJWS(params: EncodeParams): string {
  if (params.header == null) throw new TypeError('Invalid parameter "header".')

  if (!Buffer.isBuffer(params.payload))
    throw new TypeError('Invalid parameter "payload".')

  if (!(params.key instanceof JsonWebKey))
    throw new TypeError('Invalid parameter "key".')

  const joseHeader = new JoseHeader(params.header)

  const b64Header = Base64Url.encode(Buffer.from(JSON.stringify(joseHeader)))
  const b64Payload = Base64Url.encode(params.payload)

  const message = `${b64Header}.${b64Payload}`
  const signature = joseHeader.algorithm.sign(Buffer.from(message), params.key)

  return `${message}.${signature}`
}

/**
 * Decodes a JSON Web Signature Token checking
 * if its signature matches its content.
 *
 * Despite being optional, it is recommended to provide an algorithm
 * to prevent the `none attack` and the misuse of a public key as secret key.
 *
 * The algorithm specified at the header of the token
 * **MUST** match the provided algorithm, if any.
 *
 * @param params - Object defining the decoding flow.
 * @returns JsonWebSignature object containing the decoded header and payload.
 */
export function parseJWS(params: DecodeParams): JsonWebSignature {
  const validate = params.validate ?? true

  if (typeof params.token !== 'string')
    throw new TypeError('Invalid parameter "token".')

  if (params.key != null && !(params.key instanceof JsonWebKey))
    throw new TypeError('Invalid parameter "key".')

  try {
    const splittedToken = params.token.split('.')

    if (
      splittedToken.length !== 3 ||
      splittedToken.some(item => item == null || typeof item !== 'string')
    )
      throw new InvalidJsonWebSignature()

    const [b64header, b64payload, signature] = splittedToken

    const headerParams: JoseHeaderParams = JSON.parse(
      Base64Url.decode(b64header).toString('utf8')
    )

    const joseHeader = new JoseHeader(headerParams)

    if (params.algorithm && params.algorithm !== joseHeader.alg)
      throw new InvalidJsonWebSignature(
        'The algorithm used to sign this token is invalid. ' +
          `Expected "${params.algorithm}", got "${joseHeader.alg}".`
      )

    if (validate)
      joseHeader.algorithm.verify(
        signature,
        Buffer.from(`${b64header}.${b64payload}`),
        params.key
      )

    return {
      header: headerParams,
      payload: Base64Url.decode(b64payload)
    }
  } catch (error) {
    if (error instanceof InvalidJsonWebSignature) throw error

    if (error instanceof JoseError)
      throw new InvalidJsonWebSignature(error.message)

    throw new InvalidJsonWebSignature()
  }
}
