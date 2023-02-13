/**
 * Parameters of the JSON Web Token Claims.
 */
export interface JsonWebTokenClaimsParameters extends Record<string, unknown> {
  /**
   * Identifier of the Issuer of the Token.
   */
  readonly iss?: string;

  /**
   * Subject represented by the Token.
   */
  readonly sub?: string;

  /**
   * Identifier of the Audience the Token is intended to.
   */
  readonly aud?: string | string[];

  /**
   * UTC time denoting the Expiration Time of the Token.
   */
  readonly exp?: number;

  /**
   * UTC time denoting the moment when the Token will become valid.
   */
  readonly nbf?: number;

  /**
   * UTC time denoting the moment when the Token was created.
   */
  readonly iat?: number;

  /**
   * Identifier of the Token.
   */
  readonly jti?: string;
}
