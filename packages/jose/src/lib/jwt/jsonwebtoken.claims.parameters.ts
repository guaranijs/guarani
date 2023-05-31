import { Dictionary, OneOrMany } from '@guarani/types';

/**
 * Parameters of the JSON Web Token Claims.
 */
export interface JsonWebTokenClaimsParameters extends Dictionary<unknown> {
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
  aud?: OneOrMany<string>;

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
