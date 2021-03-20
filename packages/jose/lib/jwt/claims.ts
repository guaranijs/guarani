import { Objects } from '@guarani/utils'

import {
  ExpiredToken,
  InvalidJsonWebTokenClaim,
  TokenNotValidYet
} from '../exceptions'

/**
 * Defines the options for the validation of a specific claim.
 */
export interface ClaimOptions {
  /**
   * Defines whether a claim is essential or not.
   *
   * An essential claim **MUST** be present in the claims object,
   * otherwise it will fail.
   */
  essential?: boolean

  /**
   * Defines the specific value that a claim is required to have.
   *
   * If the expected value is an array, it will perform an unsorted
   * comparison between the received and expected arrays.
   *
   * @param value - Defines the required value of the claim.
   * @returns Boolean informing if the claim matches the value.
   */
  value?: unknown

  /**
   * Defines the set of values required for the claim to match.
   * For it to validate, the claim **MUST** match **AT LEAST** one of the values.
   *
   * @param values - Defines the list of required values of the claim.
   * @returns Boolean informing if the claim matches one of the values.
   */
  values?: unknown[]
}

/**
 * Defines the options for the validation of the claims.
 */
export interface ClaimsOptions {
  /**
   * Defines the options used to validate the claim.
   */
  [claim: string]: ClaimOptions
}

/**
 * Interface defining the supported claims.
 */
export interface JsonWebTokenClaims {
  /**
   * Identifier of the issuer of the token.
   */
  iss?: string

  /**
   * Subject represented by the token.
   */
  sub?: string

  /**
   * Identifier of the audience the token is intended to.
   */
  aud?: string | string[]

  /**
   * UTC time denoting the expiration of the token.
   */
  exp?: number

  /**
   * UTC time denoting when the token will become valid.
   */
  nbf?: number

  /**
   * UTC time denoting the moment when the token was created.
   */
  iat?: number

  /**
   * ID of the token. Used to prevent replay attacks.
   */
  jti?: string
}

/**
 * Implementation of RFC 7519.
 *
 * It provides validation for the default parameters of the JWT claims.
 *
 * The **JSON Web Token Claims** is a JSON object that contains information
 * about an application, system or user.
 */
export class Claims implements JsonWebTokenClaims {
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
  public readonly aud?: string | string[]

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

  /**
   * Instantiates a new JSON Web Token Claims for usage with JSON Web Tokens.
   *
   * @param claims - Defines the claims of the JSON Web Token.
   * @param options - Validation options for the claims.
   */
  public constructor(claims: JsonWebTokenClaims, options: ClaimsOptions = {}) {
    Claims.validateClaimsTypes(claims)
    Claims.validateClaimsOptions(claims, options)

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
  protected static validateClaimsTypes(claims: JsonWebTokenClaims): void {
    if ('iss' in claims && (typeof claims.iss !== 'string' || !claims.iss))
      throw new InvalidJsonWebTokenClaim('Invalid claim "iss".')

    if ('sub' in claims && (typeof claims.sub !== 'string' || !claims.sub))
      throw new InvalidJsonWebTokenClaim('Invalid claim "sub".')

    if ('aud' in claims) {
      if (!claims.aud)
        throw new InvalidJsonWebTokenClaim('Invalid claim "aud".')

      if (typeof claims.aud !== 'string' && !Array.isArray(claims.aud))
        throw new InvalidJsonWebTokenClaim('Invalid claim "aud".')

      if (
        Array.isArray(claims.aud) &&
        claims.aud.some(aud => typeof aud !== 'string')
      )
        throw new InvalidJsonWebTokenClaim('Invalid claim "aud".')
    }

    if ('exp' in claims) {
      if (typeof claims.exp !== 'number')
        throw new InvalidJsonWebTokenClaim('Invalid claim "exp".')

      if (new Date() > new Date(claims.exp)) throw new ExpiredToken()
    }

    if ('nbf' in claims) {
      if (typeof claims.nbf !== 'number')
        throw new InvalidJsonWebTokenClaim('Invalid claim "nbf".')

      if (new Date() < new Date(claims.nbf)) throw new TokenNotValidYet()
    }

    if ('iat' in claims && typeof claims.iat !== 'number')
      throw new InvalidJsonWebTokenClaim('Invalid claim "iat".')

    if ('jti' in claims && (typeof claims.jti !== 'string' || !claims.jti))
      throw new InvalidJsonWebTokenClaim('Invalid claim "jti".')
  }

  /**
   * Validates the value of each present claims based on the provided options.
   *
   * @param claims - Claims of the JSON Web Token.
   * @param options - Validation options for the claims.
   * @throws {InvalidJsonWebTokenClaim} A claim does not conform to its options.
   */
  private static validateClaimsOptions(
    claims: JsonWebTokenClaims,
    options: ClaimsOptions
  ): void {
    Object.entries(options).forEach(([claim, option]) => {
      const value = claims[claim]

      if ('essential' in option && !value)
        throw new InvalidJsonWebTokenClaim(`Missing required claim "${claim}".`)

      if (
        'value' in option &&
        !Objects.equals(value, option.value, { sortArrays: true })
      )
        throw new InvalidJsonWebTokenClaim(
          `Mismatching expected value for claim "${claim}".`
        )

      if ('values' in option) {
        if (!Array.isArray(option.values))
          throw new InvalidJsonWebTokenClaim(
            'Expected an array for the option "values".'
          )

        if (
          Array.isArray(value) &&
          value.some(item => !option.values.includes(item))
        )
          throw new InvalidJsonWebTokenClaim(
            'One or more received values are not present ' +
              `in the expected values of the claim "${claim}".`
          )

        if (typeof value === 'string' && !option.values.includes(value))
          throw new InvalidJsonWebTokenClaim(
            `Mismatching expected value for claim "${claim}". ` +
              `Received "${value}".`
          )
      }
    })
  }
}
