import { OneOrMany } from '@guarani/types';

/**
 * Defines the options for the validation of a specific claim.
 */
export interface JWTClaimOptions {
  /**
   * Defines whether a claim is essential or not.
   *
   * An essential claim **MUST** be present in the claims object,
   * otherwise it will fail.
   */
  readonly essential?: boolean;

  /**
   * Defines the specific value that a claim is required to have.
   *
   * If the expected value is an array, it will perform a sorted
   * comparison between the received and expected arrays.
   */
  readonly value?: unknown;

  /**
   * Defines the set of values required for the claim to match.
   * For it to validate, the claim **MUST** match **AT LEAST** one of the values.
   */
  readonly values?: unknown[];
}

/**
 * Interface defining the supported claims.
 */
export interface JWTClaims {
  /**
   * Identifier of the issuer of the token.
   */
  readonly iss?: string;

  /**
   * Subject represented by the token.
   */
  readonly sub?: string;

  /**
   * Identifier of the audience the token is intended to.
   */
  readonly aud?: OneOrMany<string>;

  /**
   * UTC time denoting the expiration of the token.
   */
  readonly exp?: number;

  /**
   * UTC time denoting when the token will become valid.
   */
  readonly nbf?: number;

  /**
   * UTC time denoting the moment when the token was created.
   */
  readonly iat?: number;

  /**
   * ID of the token. Used to prevent replay attacks.
   */
  readonly jti?: string;

  /**
   * Custom claim.
   */
  readonly [claim: string]: any;
}
