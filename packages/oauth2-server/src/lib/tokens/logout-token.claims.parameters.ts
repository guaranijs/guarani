import { JsonWebTokenClaimsParameters } from '@guarani/jose';
import { Dictionary, OneOrMany } from '@guarani/types';

/**
 * OpenID Connect Logout Token Claims Parameters.
 *
 * @see https://openid.net/specs/openid-connect-backchannel-1_0.html#LogoutToken
 */
export interface LogoutTokenClaimsParameters extends JsonWebTokenClaimsParameters {
  /**
   * Identifier of the Issuer of the Logout Token.
   */
  readonly iss: string;

  /**
   * Subject represented by the Logout Token.
   */
  readonly sub?: string;

  /**
   * Identifier of the Audience the Logout Token is intended to.
   */
  readonly aud: OneOrMany<string>;

  /**
   * UTC time denoting the moment when the Logout Token was created.
   */
  readonly iat: number;

  /**
   * Claim whose value is a JSON object containing the member name http://schemas.openid.net/event/backchannel-logout.
   * It is used to declare the JSON Web Token as a Logout Token.
   */
  readonly events: { 'http://schemas.openid.net/event/backchannel-logout': Dictionary<never> };

  /**
   * Identifier of the Login for the Authenticated User.
   */
  readonly sid?: string;
}
