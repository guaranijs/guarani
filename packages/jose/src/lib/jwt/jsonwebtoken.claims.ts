import { Buffer } from 'buffer';
import { isDeepStrictEqual } from 'util';

import { ExpiredJsonWebTokenException } from '../exceptions/expired-jsonwebtoken.exception';
import { InvalidJsonWebTokenClaimException } from '../exceptions/invalid-jsonwebtoken-claim.exception';
import { JsonWebTokenNotValidYetException } from '../exceptions/jsonwebtoken-not-valid-yet.exception';
import { JsonWebTokenClaimValidationOptions } from './jsonwebtoken-claim-validation.options';
import { JsonWebTokenClaimsParameters } from './jsonwebtoken.claims.parameters';

/**
 * Implementation of the JSON Web Token Claims Object.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7519.html#section-4
 */
export class JsonWebTokenClaims implements JsonWebTokenClaimsParameters {
  /**
   * Identifier of the Issuer of the Token.
   */
  public readonly iss?: string;

  /**
   * Subject represented by the Token.
   */
  public readonly sub?: string;

  /**
   * Identifier of the Audience the Token is intended to.
   */
  public readonly aud?: string | string[];

  /**
   * UTC time denoting the Expiration Time of the Token.
   */
  public readonly exp?: number;

  /**
   * UTC time denoting the moment when the Token will become valid.
   */
  public readonly nbf?: number;

  /**
   * UTC time denoting the moment when the Token was created.
   */
  public readonly iat?: number;

  /**
   * Identifier of the Token.
   */
  public readonly jti?: string;

  /**
   * Additional JSON Web Token Claims.
   */
  readonly [claim: string]: unknown;

  /**
   * Instantiates a new JSON Web Token Claims for usage with JSON Web Tokens.
   *
   * @param claims Defines the Claims of the JSON Web Token.
   * @param options Validation options for the JSON Web Token Claims.
   */
  public constructor(
    claims: JsonWebTokenClaimsParameters,
    options: Record<string, JsonWebTokenClaimValidationOptions> = {}
  ) {
    if (claims instanceof JsonWebTokenClaims) {
      return claims;
    }

    this.validateDefaultClaims(claims);
    this.validateCustomClaims?.(claims);

    this.validateClaimsOptions(claims, options);

    Object.assign(this, claims);
  }

  /**
   * Validates the Default JSON Web Token Claims based on the rules of
   * {@link https://www.rfc-editor.org/rfc/rfc7519.html#section-4 RFC 7519 Section 4}.
   *
   * @param claims JSON Web Token Claims.
   */
  private validateDefaultClaims(claims: JsonWebTokenClaimsParameters): void {
    const now = Math.floor(Date.now() / 1000);

    if (claims.iss !== undefined && typeof claims.iss !== 'string') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iss".');
    }

    if (claims.sub !== undefined && typeof claims.sub !== 'string') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "sub".');
    }

    if (claims.aud !== undefined) {
      if (typeof claims.aud !== 'string' && !Array.isArray(claims.aud)) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
      }

      if (Array.isArray(claims.aud) && claims.aud.some((aud) => typeof aud !== 'string')) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
      }
    }

    if (claims.exp !== undefined) {
      if (typeof claims.exp !== 'number' || !Number.isInteger(claims.exp)) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "exp".');
      }

      if (now > claims.exp) {
        throw new ExpiredJsonWebTokenException();
      }
    }

    if (claims.nbf !== undefined) {
      if (typeof claims.nbf !== 'number' || !Number.isInteger(claims.nbf)) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "nbf".');
      }

      if (now < claims.nbf) {
        throw new JsonWebTokenNotValidYetException();
      }
    }

    if (claims.iat !== undefined && (typeof claims.iat !== 'number' || !Number.isInteger(claims.iat))) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iat".');
    }

    if (claims.jti !== undefined && typeof claims.jti !== 'string') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "jti".');
    }
  }

  /**
   * Method used when extending **JsonWebTokenClaims** via inheritance.
   *
   * This method **SHOULD** be implemented by the child class in order to provide validation for custom
   * JSON Web Token Claims supported by it.
   *
   * *Implementation of this method is optional.*
   *
   * @param claims JSON Web Token Claims.
   */
  protected validateCustomClaims?(claims: JsonWebTokenClaimsParameters): void;

  /**
   * Validates the provided JSON Web Token Claims based on the provided Options.
   *
   * @param claims JSON Web Token Claims.
   * @param options Dictionary used to validate the provided JSON Web Token Claims.
   */
  private validateClaimsOptions(
    claims: JsonWebTokenClaimsParameters,
    options: Record<string, JsonWebTokenClaimValidationOptions>
  ): void {
    Object.entries(options).forEach(([claim, option]) => {
      const claimValue = claims[claim];

      if (option.essential === true && claimValue === undefined) {
        throw new InvalidJsonWebTokenClaimException(`Missing required claim "${claim}".`);
      }

      if (option.value !== undefined && !isDeepStrictEqual(claimValue, option.value)) {
        throw new InvalidJsonWebTokenClaimException(`Mismatching expected value for claim "${claim}".`);
      }

      if (option.values !== undefined) {
        if (!Array.isArray(option.values)) {
          throw new InvalidJsonWebTokenClaimException('Expected an array for the option "values".');
        }

        if (option.values.length === 0) {
          throw new InvalidJsonWebTokenClaimException(`Mismatching expected value for claim "${claim}".`);
        }

        option.values.forEach((value) => {
          if (!isDeepStrictEqual(value, claimValue)) {
            throw new InvalidJsonWebTokenClaimException(
              `Mismatching expected value for claim "${claim}". Received "${claimValue}".`
            );
          }
        });
      }
    });
  }

  /**
   * Returns the Stringified JSON representation of the JSON Web Token Claims.
   */
  public toString(): string {
    return JSON.stringify(this);
  }

  /**
   * Returns the Buffer version of the Stringified JSON Web Token Claims.
   */
  public toBuffer(): Buffer {
    return Buffer.from(this.toString(), 'utf8');
  }
}
