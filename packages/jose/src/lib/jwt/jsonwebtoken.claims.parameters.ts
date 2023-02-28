/**
 * Parameters of the JSON Web Token Claims.
 */
export interface JsonWebTokenClaimsParameters extends Record<string, any> {
  /**
   * Identifier of the Issuer of the Token.
   */
  iss?: string;

  /**
   * Subject represented by the Token.
   */
  sub?: string;

  /**
   * Identifier of the Audience the Token is intended to.
   */
  aud?: string | string[];

  /**
   * UTC time denoting the Expiration Time of the Token.
   */
  exp?: number;

  /**
   * UTC time denoting the moment when the Token will become valid.
   */
  nbf?: number;

  /**
   * UTC time denoting the moment when the Token was created.
   */
  iat?: number;

  /**
   * Identifier of the Token.
   */
  jti?: string;
}
