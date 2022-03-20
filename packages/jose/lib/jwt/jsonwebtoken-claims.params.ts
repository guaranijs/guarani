import { OneOrMany, Optional } from '@guarani/types';

/**
 * Parameters of the JSON Web Token Claims.
 */
export interface JsonWebTokenClaimsParams {
  /**
   * Identifier of the Issuer of the Token.
   */
  readonly iss?: Optional<string>;

  /**
   * Subject represented by the Token.
   */
  readonly sub?: Optional<string>;

  /**
   * Identifier of the Audience the Token is intended to.
   */
  readonly aud?: Optional<OneOrMany<string>>;

  /**
   * UTC time denoting the Expiration Time of the Token.
   */
  readonly exp?: Optional<number>;

  /**
   * UTC time denoting the moment when the Token will become valid.
   */
  readonly nbf?: Optional<number>;

  /**
   * UTC time denoting the moment when the Token was created.
   */
  readonly iat?: Optional<number>;

  /**
   * Identifier of the Token.
   */
  readonly jti?: Optional<string>;

  /**
   * Additional Claims.
   */
  readonly [claim: string]: any;
}
