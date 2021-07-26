import { Dict, Objects, OneOrMany } from '@guarani/utils'

import {
  ExpiredToken,
  InvalidJsonWebTokenClaim,
  TokenNotValidYet
} from '../exceptions'
import { JWTClaimOptions, JWTClaims } from './jwt-claims'

/**
 * Implementation of RFC 7519.
 *
 * It provides validation for the default parameters of the JWT claims.
 *
 * The **JSON Web Token Claims** is a JSON object that contains information
 * about an application, system or user.
 */
export class JsonWebTokenClaims implements JWTClaims {
  /**
   * Identifier of the issuer of the token.
   */
  public readonly iss?: string

  /**
   * Subject represented by the token.
   */
  public readonly sub?: string

  /**
   * Identifier of the audience the token is intended to.
   */
  public readonly aud?: OneOrMany<string>

  /**
   * UTC time denoting the expiration of the token.
   */
  public readonly exp?: number

  /**
   * UTC time denoting when the token will become valid.
   */
  public readonly nbf?: number

  /**
   * UTC time denoting the moment when the token was created.
   */
  public readonly iat?: number

  /**
   * ID of the token. Used to prevent replay attacks.
   */
  public readonly jti?: string

  public constructor(
    claims: JsonWebTokenClaims,
    options?: Dict<JWTClaimOptions>
  )

  public constructor(claims: JWTClaims, options?: Dict<JWTClaimOptions>)

  /**
   * Instantiates a new JSON Web Token Claims for usage with JSON Web Tokens.
   *
   * @param claims - Defines the claims of the JSON Web Token.
   * @param options - Validation options for the claims.
   */
  public constructor(
    claims: JsonWebTokenClaims | JWTClaims,
    options?: Dict<JWTClaimOptions>
  ) {
    if (claims instanceof JsonWebTokenClaims) {
      return claims
    }

    options ??= {}

    this.validateClaimsTypes(claims)
    this.validateClaimsOptions(claims, options)

    Object.assign(this, Objects.removeNullishValues(claims))
  }

  /**
   * Validates the type of each present claim and their semantic values
   * according to the {@link https://tools.ietf.org/html/rfc7519|RFC 7519}.
   *
   * @param claims - Claims of the JSON Web Token.
   * @throws {InvalidJsonWebTokenClaim} The received claim is invalid.
   * @throws {ExpiredToken} The JSON Web Token is expired.
   * @throws {TokenNotValidYet} The token is not valid yet.
   */
  protected validateClaimsTypes(claims: JWTClaims): void {
    const now = Math.floor(Date.now() / 1000)

    if ('iss' in claims && (typeof claims.iss !== 'string' || !claims.iss)) {
      throw new InvalidJsonWebTokenClaim('Invalid claim "iss".')
    }

    if ('sub' in claims && (typeof claims.sub !== 'string' || !claims.sub)) {
      throw new InvalidJsonWebTokenClaim('Invalid claim "sub".')
    }

    if ('aud' in claims) {
      if (!claims.aud) {
        throw new InvalidJsonWebTokenClaim('Invalid claim "aud".')
      }

      if (typeof claims.aud !== 'string' && !Array.isArray(claims.aud)) {
        throw new InvalidJsonWebTokenClaim('Invalid claim "aud".')
      }

      if (
        Array.isArray(claims.aud) &&
        claims.aud.some(aud => typeof aud !== 'string')
      ) {
        throw new InvalidJsonWebTokenClaim('Invalid claim "aud".')
      }
    }

    if ('exp' in claims) {
      if (typeof claims.exp !== 'number') {
        throw new InvalidJsonWebTokenClaim('Invalid claim "exp".')
      }

      if (now > claims.exp) {
        throw new ExpiredToken()
      }
    }

    if ('nbf' in claims) {
      if (typeof claims.nbf !== 'number') {
        throw new InvalidJsonWebTokenClaim('Invalid claim "nbf".')
      }

      if (now < claims.nbf) {
        throw new TokenNotValidYet()
      }
    }

    if ('iat' in claims && typeof claims.iat !== 'number') {
      throw new InvalidJsonWebTokenClaim('Invalid claim "iat".')
    }

    if ('jti' in claims && (typeof claims.jti !== 'string' || !claims.jti)) {
      throw new InvalidJsonWebTokenClaim('Invalid claim "jti".')
    }
  }

  /**
   * Validates the value of each present claims based on the provided options.
   *
   * @param claims - Claims of the JSON Web Token.
   * @param options - Validation options for the claims.
   * @throws {InvalidJsonWebTokenClaim} A claim does not conform to its options.
   */
  private validateClaimsOptions(
    claims: JWTClaims,
    options: Dict<JWTClaimOptions>
  ): void {
    Object.entries(options).forEach(([claim, option]) => {
      const value = claims[claim]

      if ('essential' in option && !value) {
        throw new InvalidJsonWebTokenClaim(`Missing required claim "${claim}".`)
      }

      if (
        'value' in option &&
        !Objects.equals(value, option.value, { sortArrays: true })
      ) {
        throw new InvalidJsonWebTokenClaim(
          `Mismatching expected value for claim "${claim}".`
        )
      }

      if ('values' in option) {
        if (!Array.isArray(option.values)) {
          throw new InvalidJsonWebTokenClaim(
            'Expected an array for the option "values".'
          )
        }

        if (
          Array.isArray(value) &&
          value.some(item => !option.values.includes(item))
        ) {
          throw new InvalidJsonWebTokenClaim(
            'One or more received values are not present ' +
              `in the expected values of the claim "${claim}".`
          )
        }

        if (typeof value === 'string' && !option.values.includes(value)) {
          throw new InvalidJsonWebTokenClaim(
            `Mismatching expected value for claim "${claim}". ` +
              `Received "${value}".`
          )
        }
      }
    })
  }
}
