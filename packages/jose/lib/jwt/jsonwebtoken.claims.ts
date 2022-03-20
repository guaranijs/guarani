import { removeNullishValues } from '@guarani/objects';
import { Dict, OneOrMany, Optional } from '@guarani/types';

import { isDeepStrictEqual } from 'util';

import { ExpiredTokenException } from '../exceptions/expired-token.exception';
import { InvalidJsonWebTokenClaimException } from '../exceptions/invalid-json-web-token-claim.exception';
import { InvalidJsonWebTokenException } from '../exceptions/invalid-json-web-token.exception';
import { JoseException } from '../exceptions/jose.exception';
import { TokenNotValidYetException } from '../exceptions/token-not-valid-yet.exception';
import { JsonWebTokenClaimOptions } from './jsonwebtoken-claim.options';
import { JsonWebTokenClaimsParams } from './jsonwebtoken-claims.params';

/**
 * Implementation of RFC 7519.
 *
 * It provides validation for the default parameters of the JSON Web Token Claims.
 *
 * The **JSON Web Token Claims** is a JSON object that contains information about an application, system or user.
 */
export class JsonWebTokenClaims implements JsonWebTokenClaimsParams {
  /**
   * Identifier of the Issuer of the Token.
   */
  public readonly iss?: Optional<string>;

  /**
   * Subject represented by the Token.
   */
  public readonly sub?: Optional<string>;

  /**
   * Identifier of the Audience the Token is intended to.
   */
  public readonly aud?: Optional<OneOrMany<string>>;

  /**
   * UTC time denoting the Expiration Time of the Token.
   */
  public readonly exp?: Optional<number>;

  /**
   * UTC time denoting the moment when the Token will become valid.
   */
  public readonly nbf?: Optional<number>;

  /**
   * UTC time denoting the moment when the Token was created.
   */
  public readonly iat?: Optional<number>;

  /**
   * Identifier of the Token.
   */
  public readonly jti?: Optional<string>;

  /**
   * Instantiates a new JSON Web Token Claims for usage with JSON Web Tokens.
   *
   * @param claims Defines the claims of the JSON Web Token.
   * @param options Validation options for the claims.
   */
  public constructor(claims: JsonWebTokenClaimsParams, options: Optional<Dict<JsonWebTokenClaimOptions>> = {}) {
    if (claims instanceof JsonWebTokenClaims) {
      return claims;
    }

    this.validateDefaultClaims(claims);
    this.validateCustomClaims?.(claims);

    this.validateClaimsOptions(claims, options);

    Object.assign(this, removeNullishValues(claims));
  }

  /**
   * Parses the provided Base64Url Encoded String into a JSON Web Token Claims object.
   *
   * @param data Base64Url Encoded String encoded JSON Web Token Claims.
   * @param options Validation options for the claims.
   * @returns Parsed JSON Web Token Claims.
   */
  public static parse(data: string, options?: Optional<Dict<JsonWebTokenClaimOptions>>): JsonWebTokenClaims;

  /**
   * Parses the provided Buffer into a JSON Web Token Claims object.
   *
   * @param data Buffer encoded JSON Web Token Claims.
   * @param options Validation options for the claims.
   * @returns Parsed JSON Web Token Claims.
   */
  public static parse(data: Buffer, options?: Optional<Dict<JsonWebTokenClaimOptions>>): JsonWebTokenClaims;

  /**
   * Parses the provided data into a JSON Web Token Claims object.
   *
   * @param data Encoded JSON Web Token Claims.
   * @param options Validation options for the claims.
   * @returns Parsed JSON Web Token Claims.
   */
  public static parse(data: string | Buffer, options?: Optional<Dict<JsonWebTokenClaimOptions>>): JsonWebTokenClaims {
    try {
      if (typeof data === 'string') {
        data = Buffer.from(data, 'base64url');
      }

      const claims = JSON.parse(data.toString('utf8'));
      return new JsonWebTokenClaims(claims, options);
    } catch (exc: any) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      throw new InvalidJsonWebTokenException();
    }
  }

  /**
   * Validates the Default JSON Web Token Claims based on the rules of
   * {@link https://www.rfc-editor.org/rfc/rfc7519.html#section-4 RFC 7519 Section 4}.
   *
   * @param claims JSON Web Token Claims.
   */
  protected validateDefaultClaims(claims: JsonWebTokenClaimsParams): void {
    const now = Math.floor(Date.now() / 1000);

    if (claims.iss !== undefined && (typeof claims.iss !== 'string' || claims.iss.length === 0)) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iss".');
    }

    if (claims.sub !== undefined && (typeof claims.sub !== 'string' || claims.sub.length === 0)) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "sub".');
    }

    if (claims.aud !== undefined) {
      if (typeof claims.aud !== 'string' && !Array.isArray(claims.aud)) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
      }

      if (Array.isArray(claims.aud) && claims.aud.some((aud) => typeof aud !== 'string' || aud.length === 0)) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
      }

      if (typeof claims.aud === 'string' && claims.aud.length === 0) {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
      }
    }

    if (claims.exp !== undefined) {
      if (typeof claims.exp !== 'number') {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "exp".');
      }

      if (now > claims.exp) {
        throw new ExpiredTokenException();
      }
    }

    if (claims.nbf !== undefined) {
      if (typeof claims.nbf !== 'number') {
        throw new InvalidJsonWebTokenClaimException('Invalid claim "nbf".');
      }

      if (now < claims.nbf) {
        throw new TokenNotValidYetException();
      }
    }

    if (claims.iat !== undefined && typeof claims.iat !== 'number') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iat".');
    }

    if (claims.jti !== undefined && (typeof claims.jti !== 'string' || claims.jti.length === 0)) {
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
  protected validateCustomClaims?(claims: JsonWebTokenClaimsParams): void;

  /**
   * Validates the provided JSON Web Token Claims based on the provided Options.
   *
   * @param claims JSON Web Token Claims.
   * @param options Dictionary used to validate the provided JSON Web Token Claims.
   */
  private validateClaimsOptions(claims: JsonWebTokenClaimsParams, options: Dict<JsonWebTokenClaimOptions>): void {
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
}
