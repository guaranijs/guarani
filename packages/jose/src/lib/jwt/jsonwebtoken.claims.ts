import { removeUndefined } from '@guarani/primitives';

import { Buffer } from 'buffer';
import { isDeepStrictEqual } from 'util';

import { ExpiredJsonWebTokenException } from '../exceptions/expired-jsonwebtoken.exception';
import { InvalidJsonWebTokenClaimException } from '../exceptions/invalid-jsonwebtoken-claim.exception';
import { InvalidJsonWebTokenClaimsException } from '../exceptions/invalid-jsonwebtoken-claims.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebTokenNotValidYetException } from '../exceptions/jsonwebtoken-not-valid-yet.exception';
import { JsonWebTokenClaimValidationOptions } from './jsonwebtoken-claim-validation.options';
import { JsonWebTokenClaimsParseOptions } from './jsonwebtoken-claims-parse.options';
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
  public iss?: string;

  /**
   * Subject represented by the Token.
   */
  public sub?: string;

  /**
   * Identifier of the Audience the Token is intended to.
   */
  public aud?: string | string[];

  /**
   * UTC time denoting the Expiration Time of the Token.
   */
  public exp?: number;

  /**
   * UTC time denoting the moment when the Token will become valid.
   */
  public nbf?: number;

  /**
   * UTC time denoting the moment when the Token was created.
   */
  public iat?: number;

  /**
   * Identifier of the Token.
   */
  public jti?: string;

  /**
   * Additional JSON Web Token Claims.
   */
  [claim: string]: any;

  /**
   * Instantiates a new JSON Web Token Claims for usage with JSON Web Tokens.
   *
   * @param claims Defines the Claims of the JSON Web Token.
   */
  public constructor(claims: JsonWebTokenClaimsParameters) {
    if (claims instanceof JsonWebTokenClaims) {
      return claims;
    }

    Object.assign(this, removeUndefined<JsonWebTokenClaimsParameters>(claims));
  }

  /**
   * Parses a Buffer into a JSON Web Token Claims object.
   *
   * @param data Buffer representation of the JSON Web Token Claims to be parsed.
   * @param options Options used to validate the JSON Web Token Claims.
   * @returns Instance of a JSON Web Toke Claims based on the provided Buffer.
   */
  public static async parse(data: Buffer, options: JsonWebTokenClaimsParseOptions = {}): Promise<JsonWebTokenClaims> {
    try {
      const claims: JsonWebTokenClaimsParameters = JSON.parse(data.toString('utf8'));

      this.validateDefaultClaims(claims, options.ignoreExpired);
      this.validateCustomClaims?.(claims);

      if (typeof options.validationOptions !== 'undefined') {
        this.validateClaimsOptions(claims, options.validationOptions);
      }

      return new JsonWebTokenClaims(claims);
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebTokenClaimsException();
      exception.cause = exc;

      throw exception;
    }
  }

  /**
   * Validates the Default JSON Web Token Claims based on the rules of
   * {@link https://www.rfc-editor.org/rfc/rfc7519.html#section-4 RFC 7519 Section 4}.
   *
   * @param claims JSON Web Token Claims.
   * @param ignoreExpired Informs if the **exp** claim should be ignored.
   */
  private static validateDefaultClaims(claims: JsonWebTokenClaimsParameters, ignoreExpired = false): void {
    const now = Math.floor(Date.now() / 1000);

    if (typeof claims.iss !== 'undefined' && typeof claims.iss !== 'string') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iss".');
    }

    if (typeof claims.sub !== 'undefined' && typeof claims.sub !== 'string') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "sub".');
    }

    if (typeof claims.aud !== 'undefined') {
      if (typeof claims.aud !== 'string' && !Array.isArray(claims.aud)) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
      }

      if (Array.isArray(claims.aud) && claims.aud.some((aud) => typeof aud !== 'string')) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
      }
    }

    if (typeof claims.exp !== 'undefined') {
      if (typeof claims.exp !== 'number' || !Number.isInteger(claims.exp)) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "exp".');
      }

      if (now > claims.exp && !ignoreExpired) {
        throw new ExpiredJsonWebTokenException();
      }
    }

    if (typeof claims.nbf !== 'undefined') {
      if (typeof claims.nbf !== 'number' || !Number.isInteger(claims.nbf)) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "nbf".');
      }

      if (now < claims.nbf) {
        throw new JsonWebTokenNotValidYetException();
      }
    }

    if (typeof claims.iat !== 'undefined' && (typeof claims.iat !== 'number' || !Number.isInteger(claims.iat))) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iat".');
    }

    if (typeof claims.jti !== 'undefined' && typeof claims.jti !== 'string') {
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
  protected static validateCustomClaims?(claims: JsonWebTokenClaimsParameters): void;

  /**
   * Validates the provided JSON Web Token Claims based on the provided Options.
   *
   * @param claims JSON Web Token Claims.
   * @param options Dictionary used to validate the provided JSON Web Token Claims.
   */
  private static validateClaimsOptions(
    claims: JsonWebTokenClaimsParameters,
    options: Record<string, JsonWebTokenClaimValidationOptions | null>
  ): void {
    Object.entries(options).forEach(([claim, option]) => {
      if (option === null) {
        return;
      }

      if (typeof option.value !== 'undefined' && typeof option.values !== 'undefined') {
        throw new InvalidJsonWebTokenClaimException('Cannot have both "value" and "values" options for a claim.');
      }

      const claimValue = claims[claim];

      if (option.essential === true && typeof claimValue === 'undefined') {
        throw new InvalidJsonWebTokenClaimException(`Missing required claim "${claim}".`);
      }

      if (typeof option.value !== 'undefined') {
        if (option.essential === false && typeof claimValue === 'undefined') {
          return;
        }

        if (!isDeepStrictEqual(claimValue, option.value)) {
          throw new InvalidJsonWebTokenClaimException(`Mismatching expected value for claim "${claim}".`);
        }
      }

      if (typeof option.values !== 'undefined') {
        if (option.essential === false && typeof claimValue === 'undefined') {
          return;
        }

        if (!Array.isArray(option.values)) {
          throw new InvalidJsonWebTokenClaimException('Expected an array for the option "values".');
        }

        if (option.values.length === 0) {
          throw new InvalidJsonWebTokenClaimException(`Mismatching expected value for claim "${claim}".`);
        }

        if (!option.values.some((value) => isDeepStrictEqual(value, claimValue))) {
          throw new InvalidJsonWebTokenClaimException(`Mismatching expected value for claim "${claim}".`);
        }
      }
    });
  }

  /**
   * Returns the Stringified JSON representation of the JSON Web Token Claims.
   */
  public toString(): string {
    return JSON.stringify(removeUndefined<JsonWebTokenClaims>(this));
  }

  /**
   * Returns the Buffer version of the Stringified JSON Web Token Claims.
   */
  public toBuffer(): Buffer {
    return Buffer.from(this.toString(), 'utf8');
  }
}
