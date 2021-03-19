import { Objects } from '@guarani/utils'

import { InvalidJoseHeader } from '../exceptions'
import { KeyOptions } from '../jwk'
import { Algorithms, JWSAlgorithm } from './algorithms'

/**
 * Defines the parameters supported by the JOSE Header.
 */
export interface JoseHeaderParams {
  /**
   * JWS Algorithm used to sign and verify the token.
   */
  alg: string

  /**
   * URI of a JWK Set that contains the key used to sign the token.
   */
  jku?: string

  /**
   * JSON Web Key used to sign the token.
   */
  jwk?: KeyOptions

  /**
   * ID of the key used to sign the token.
   */
  kid?: string

  /**
   * URI of the X.509 certificate of the key.
   */
  x5u?: string

  /**
   * Chain of X.509 certificates of the key.
   */
  x5c?: string[]

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  x5t?: string

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key.
   */
  'x5t#S256'?: string

  /**
   * Defines the type of the entire token.
   */
  typ?: string

  /**
   * Defines the type of the payload.
   */
  cty?: string

  /**
   * Defines the parameters that MUST be present in the header.
   */
  crit?: string[]

  // Custom keys not supported out-of-the-box.
  [key: string]: any
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
export class JoseHeader {
  /**
   * JWS Algorithm used to sign and verify the token.
   */
  public readonly alg: string

  /**
   * URI of a JWK Set that contains the key used to sign the token.
   */
  public readonly jku?: string

  /**
   * JSON Web Key used to sign the token.
   */
  public readonly jwk?: KeyOptions

  /**
   * ID of the key used to sign the token.
   */
  public readonly kid?: string

  /**
   * URI of the X.509 certificate of the key.
   */
  public readonly x5u?: string

  /**
   * Chain of X.509 certificates of the key.
   */
  public readonly x5c?: string[]

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key.
   */
  public readonly x5t?: string

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key.
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
   * Instantiates a new JOSE Header for usage with JSON Web Signatures.
   *
   * @param header - Defines the parameters of the JOSE Header.
   */
  public constructor(header: JoseHeaderParams) {
    if (!(header.alg in Algorithms))
      throw new InvalidJoseHeader('Invalid JSON Web Signature Algorithm.')

    if (header.jku) throw new InvalidJoseHeader('Unsupported parameter "jku".')

    if (header.jwk) throw new InvalidJoseHeader('Unsupported parameter "jwk".')

    if (header.kid && typeof header.kid !== 'string')
      throw new InvalidJoseHeader('Invalid parameter "kid".')

    if (header.x5u) throw new InvalidJoseHeader('Unsupported parameter "x5u".')

    if (header.x5c) throw new InvalidJoseHeader('Unsupported parameter "x5c".')

    if (header.x5t) throw new InvalidJoseHeader('Unsupported parameter "x5t".')

    if (header['x5t#S256'])
      throw new InvalidJoseHeader('Unsupported parameter "x5t#S256".')

    if (header.crit) {
      if (!Array.isArray(header.crit) || header.crit.length === 0)
        throw new InvalidJoseHeader('Invalid parameter "crit".')

      if (header.crit.some(item => typeof item !== 'string' || !item))
        throw new InvalidJoseHeader('Invalid parameter "crit".')

      header.crit.forEach(item => {
        if (!(item in header))
          throw new InvalidJoseHeader(`Missing required parameter "${item}".`)
      })
    }

    Object.assign(
      this,
      Objects.removeNullishValues({
        alg: header.alg,
        jku: header.jku,
        jwk: header.jwk,
        kid: header.kid,
        x5u: header.x5u,
        x5c: header.x5c,
        x5t: header.x5t,
        'x5t#S256': header['x5t#S256'],
        typ: header.typ,
        cty: header.cty,
        crit: header.crit
      })
    )
  }

  /**
   * Instance of the algorithm used to sign and verify the token.
   */
  public get algorithm(): JWSAlgorithm {
    return Algorithms[this.alg]()
  }
}
