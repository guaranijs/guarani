import { Objects } from '@guarani/utils'

import { InvalidJoseHeader } from '../exceptions'
import {
  JoseHeader,
  JoseHeaderParams,
  JoseProtectedAndUnprotectedHeaders
} from '../jose.header'
import { JsonWebKeyParams } from '../jwk'
import { JWS_ALGORITHMS, SupportedJWSAlgorithm } from './algorithms'

/**
 * Defines the parameters supported by the JWS JOSE Header.
 */
export interface JWSHeaderParams extends JoseHeaderParams {
  /**
   * JWS Algorithm used to sign and verify the token.
   */
  readonly alg: SupportedJWSAlgorithm

  /**
   * URI of a JWK Set that contains the key used to sign the token.
   */
  readonly jku?: string

  /**
   * JSON Web Key used to sign the token.
   */
  readonly jwk?: JsonWebKeyParams

  /**
   * ID of the key used to sign the token.
   */
  readonly kid?: string

  /**
   * URI of the X.509 certificate of the key used to sign the token.
   */
  readonly x5u?: string

  /**
   * Chain of X.509 certificates of the key used to sign the token.
   */
  readonly x5c?: string[]

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key used
   * to sign the token.
   */
  readonly x5t?: string

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key used
   * to sign the token.
   */
  readonly 'x5t#S256'?: string

  /**
   * Defines the type of the entire token.
   */
  readonly typ?: string

  /**
   * Defines the type of the payload.
   */
  readonly cty?: string

  /**
   * Defines the parameters that MUST be present in the header.
   */
  readonly crit?: string[]
}

/**
 * JWS Headers that compose the JSON Web Signature's JOSE Header.
 */
export interface JWSProtectedAndUnprotectedHeaders
  extends JoseProtectedAndUnprotectedHeaders {
  /**
   * JWS Protected Header.
   */
  readonly protectedHeader?: Partial<JWSHeaderParams>

  /**
   * JWS Unprotected Header.
   */
  readonly unprotectedHeader?: Partial<JWSHeaderParams>
}

/**
 * Implementation of RFC 7515.
 *
 * This is the implementation of the Header of the Json Web Signature.
 * It provides validation for the default parameters of the JOSE header.
 *
 * The JOSE Header is a JSON object that provides information on how to
 * manipulate the payload of the message, such as permitted algorithms
 * and the keys to be used in signing and verifying the payload.
 */
export class JsonWebSignatureHeader
  extends JoseHeader
  implements JWSHeaderParams {
  /**
   * JWS Algorithm used to sign and verify the token.
   */
  public readonly alg: SupportedJWSAlgorithm

  /**
   * URI of a JWK Set that contains the key used to sign the token.
   */
  public readonly jku?: string

  /**
   * JSON Web Key used to sign the token.
   */
  public readonly jwk?: JsonWebKeyParams

  /**
   * ID of the key used to sign the token.
   */
  public readonly kid?: string

  /**
   * URI of the X.509 certificate of the key used to sign the token.
   */
  public readonly x5u?: string

  /**
   * Chain of X.509 certificates of the key used to sign the token.
   */
  public readonly x5c?: string[]

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key used
   * to sign the token.
   */
  public readonly x5t?: string

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key used
   * to sign the token.
   */
  public readonly 'x5t#S256'?: string

  /**
   * Defines the type of the entire token.
   */
  public readonly typ?: string

  /**
   * Defines the type of the payload.
   */
  public readonly cty?: string

  /**
   * Defines the parameters that MUST be present in the header.
   */
  public readonly crit?: string[]

  /**
   * JWS Protected Header.
   */
  public readonly protectedHeader?: JWSHeaderParams

  /**
   * JWS Unprotected Header.
   */
  public readonly unprotectedHeader?: JWSHeaderParams

  /**
   * Returns the provided JWS JOSE Header unmodified.
   *
   * @param header - Instance of a JsonWebSignatureHeader
   */
  public constructor(header: JsonWebSignatureHeader)

  /**
   * Instantiates a new JWS JOSE Header for JWS Compact Serialization.
   *
   * @param header - Parameters of the JWS JOSE Header.
   */
  public constructor(header: JWSHeaderParams)

  /**
   * Instantiates a new JWS JOSE Header for JWS JSON Serialization.
   *
   * @param header - Protected and Unprotected Headers of the JWS JOSE Header.
   */
  public constructor(header: JWSProtectedAndUnprotectedHeaders)

  public constructor(
    header:
      | JsonWebSignatureHeader
      | JWSHeaderParams
      | JWSProtectedAndUnprotectedHeaders
  ) {
    super()

    if (header instanceof JsonWebSignatureHeader) {
      return header
    }

    if (JsonWebSignatureHeader.isJWSProtectedAndUnprotectedHeaders(header)) {
      const { protectedHeader, unprotectedHeader } = header

      if (protectedHeader == null && unprotectedHeader == null) {
        throw new InvalidJoseHeader()
      }

      const joseHeader: Partial<JWSHeaderParams> = {}

      if (protectedHeader) {
        this.checkHeader(protectedHeader)
        Object.assign(joseHeader, protectedHeader)
      }

      if (unprotectedHeader) {
        this.checkHeader(unprotectedHeader)
        Object.assign(joseHeader, unprotectedHeader)
      }

      if (joseHeader.alg == null) {
        throw new InvalidJoseHeader('Missing required parameter "alg".')
      }

      Object.defineProperty(this, 'protectedHeader', {
        value: Objects.removeNullishValues(protectedHeader)
      })

      Object.defineProperty(this, 'unprotectedHeader', {
        value: Objects.removeNullishValues(unprotectedHeader)
      })

      Object.assign(this, Objects.removeNullishValues(joseHeader))
    } else {
      if (header.alg == null) {
        throw new InvalidJoseHeader('Missing required parameter "alg".')
      }

      if ('protectedHeader' in header || 'unprotectedHeader' in header) {
        throw new InvalidJoseHeader()
      }

      this.checkHeader(header)

      Object.assign(this, Objects.removeNullishValues(header))
    }
  }

  /**
   * Validates the parameters of the provided JWS JOSE Header.
   *
   * @param header - JWS JOSE Header to be validated.
   */
  protected checkHeader(header: Partial<JWSHeaderParams>): void {
    super.checkHeader(header)

    if ('alg' in header && !(header.alg in JWS_ALGORITHMS)) {
      throw new InvalidJoseHeader('Invalid JSON Web Signature Algorithm.')
    }
  }

  /**
   * Checks if a JOSE Header is a JWS JSON Serialization ready header.
   *
   * @param header - JOSE Header to be checked.
   * @returns Header is a JWS JSON Serialization ready header.
   */
  private static isJWSProtectedAndUnprotectedHeaders(
    header: any
  ): header is JWSProtectedAndUnprotectedHeaders {
    const params = new Set(Object.keys(header))

    return (
      (params.size === 1 &&
        (params.has('protectedHeader') || params.has('unprotectedHeader'))) ||
      (params.size === 2 &&
        params.has('protectedHeader') &&
        params.has('unprotectedHeader'))
    )
  }
}
