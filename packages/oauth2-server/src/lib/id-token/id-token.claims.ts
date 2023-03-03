import {
  InvalidJsonWebTokenClaimException,
  JsonWebTokenClaims,
  JsonWebTokenClaimValidationOptions,
} from '@guarani/jose';

import { IdTokenClaimsParameters } from './id-token.claims.parameters';

/**
 * OpenID Connect ID Token Claims.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 */
export class IdTokenClaims extends JsonWebTokenClaims implements IdTokenClaimsParameters {
  /**
   * Identifier of the Issuer of the ID Token.
   */
  public override readonly iss!: string;

  /**
   * Subject represented by the ID Token.
   */
  public override readonly sub!: string;

  /**
   * Identifier of the Audience the ID Token is intended to.
   */
  public override readonly aud!: string | string[];

  /**
   * UTC time denoting the Expiration Time of the ID Token.
   */
  public override readonly exp!: number;

  /**
   * UTC time denoting the moment when the ID Token was created.
   */
  public override readonly iat!: number;

  /**
   * Time when the End-User was authenticated.
   */
  public auth_time?: number;

  /**
   * Value provided at the Authentication Request to be passed unmodified to the ID Token.
   */
  public nonce?: string;

  /**
   * Authentication Context Class Reference value that identifies the Authentication Context Class
   * that the authentication performed satisfied.
   */
  public acr?: string;

  /**
   * Authentication Methods References.
   */
  public amr?: string[];

  /**
   * Authorized party to which the ID Token was issued.
   */
  public azp?: string;

  /**
   * Base64Url encoding of the left-most half of the hash of the octets of the ASCII **access_token**,
   * where the hash algorithm is the one used in the **alg** JSON Web Signature Header Parameter of the ID Token.
   */
  public at_hash?: string;

  /**
   * Base64Url encoding of the left-most half of the hash of the octets of the ASCII **code**,
   * where the hash algorithm is the one used in the **alg** JSON Web Signature Header Parameter of the ID Token.
   */
  public c_hash?: string;

  /**
   * Instantiates a new ID Token.
   *
   * @param claims Defines the claims of the ID Token.
   * @param options Validation options for the claims.
   */
  public constructor(claims: IdTokenClaimsParameters, options?: Record<string, JsonWebTokenClaimValidationOptions>) {
    super(claims, options);
  }

  /**
   * Validates the claims of the ID Token.
   *
   * @param claims Claims of the ID Token.
   */
  protected override validateCustomClaims(claims: IdTokenClaimsParameters): void {
    if (claims.iss === undefined) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iss".');
    }

    if (claims.sub === undefined) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "sub".');
    }

    if (claims.aud === undefined) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
    }

    if (claims.exp === undefined) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "exp".');
    }

    if (claims.iat === undefined) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iat".');
    }

    if (claims.auth_time !== undefined && typeof claims.auth_time !== 'number') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "auth_time".');
    }

    if (claims.nonce !== undefined && (typeof claims.nonce !== 'string' || claims.nonce.length === 0)) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "nonce".');
    }

    if (claims.acr !== undefined && (typeof claims.acr !== 'string' || claims.acr.length === 0)) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "acr".');
    }

    if (
      claims.amr !== undefined &&
      (!Array.isArray(claims.amr) || claims.amr.some((method) => typeof method !== 'string' || method.length === 0))
    ) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "amr".');
    }

    if (claims.azp !== undefined && (typeof claims.azp !== 'string' || claims.azp.length === 0)) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "azp".');
    }

    if (claims.at_hash !== undefined && (typeof claims.at_hash !== 'string' || claims.at_hash.length === 0)) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "at_hash".');
    }

    if (claims.c_hash !== undefined && (typeof claims.c_hash !== 'string' || claims.c_hash.length === 0)) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "c_hash".');
    }
  }
}
