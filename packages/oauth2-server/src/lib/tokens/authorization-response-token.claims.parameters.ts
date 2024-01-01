import { JsonWebTokenClaimsParameters } from '@guarani/jose';
import { OneOrMany } from '@guarani/types';

/**
 * OpenID Connect Authorization Response Token Claims Parameters.
 *
 * @see https://openid.net/specs/oauth-v2-jarm.html#section-2.1
 */
export interface AuthorizationResponseTokenClaimsParameters extends JsonWebTokenClaimsParameters {
  /**
   * Identifier of the Issuer of the Authorization Response Token.
   */
  readonly iss: string;

  /**
   * Identifier of the Audience the Authorization Response Token is intended to.
   */
  readonly aud: OneOrMany<string>;

  /**
   * UTC time denoting the Expiration Time of the Authorization Response Token.
   */
  readonly exp: number;

  /**
   * UTC time denoting the moment when the Authorization Response Token will become valid.
   */
  readonly nbf?: number;

  /**
   * UTC time denoting the moment when the Authorization Response Token was created.
   */
  readonly iat: number;

  /**
   * Identifier of the Authorization Response Token.
   */
  readonly jti?: string;
}
