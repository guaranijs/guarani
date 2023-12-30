import { isDeepStrictEqual } from 'util';

import {
  InvalidJsonWebTokenClaimException,
  InvalidJsonWebTokenClaimsException,
  JsonWebTokenClaims,
} from '@guarani/jose';
import { Dictionary, OneOrMany } from '@guarani/types';

import { LogoutTokenClaimsParameters } from './logout-token.claims.parameters';

/**
 * OpenID Connect Logout Token Claims Parameters.
 *
 * @see https://openid.net/specs/openid-connect-backchannel-1_0.html#LogoutToken
 */
export class LogoutTokenClaims extends JsonWebTokenClaims implements LogoutTokenClaimsParameters {
  /**
   * Identifier of the Issuer of the Logout Token.
   */
  public override readonly iss!: string;

  /**
   * Subject represented by the Logout Token.
   */
  public override readonly sub?: string;

  /**
   * Identifier of the Audience the Logout Token is intended to.
   */
  public override readonly aud!: OneOrMany<string>;

  /**
   * UTC time denoting the moment when the Logout Token was created.
   */
  public override readonly iat!: number;

  /**
   * Claim whose value is a JSON object containing the member name http://schemas.openid.net/event/backchannel-logout.
   * It is used to declare the JSON Web Token as a Logout Token.
   */
  public readonly events!: { 'http://schemas.openid.net/event/backchannel-logout': Dictionary<never> };

  /**
   * Identifier of the Login for the Authenticated User.
   */
  public readonly sid?: string;

  /**
   * Instantiates a new Logout Token.
   *
   * @param claims Defines the claims of the Logout Token.
   */
  public constructor(claims: LogoutTokenClaimsParameters) {
    super(claims);
  }

  /**
   * Validates the claims of the Logout Token.
   *
   * @param claims Claims of the Logout Token.
   */
  protected static override validateCustomClaims(claims: LogoutTokenClaimsParameters): void {
    if (typeof claims.iss === 'undefined') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iss".');
    }

    if (typeof claims.aud === 'undefined') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
    }

    if (typeof claims.iat === 'undefined') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iat".');
    }

    if (
      typeof claims.events !== 'object' ||
      claims.events === null ||
      !isDeepStrictEqual(claims.events, { 'http://schemas.openid.net/event/backchannel-logout': {} })
    ) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "events".');
    }

    if (typeof claims.sub === 'undefined' && typeof claims.sid === 'undefined') {
      throw new InvalidJsonWebTokenClaimsException('Missing at least one of the claims "sub" and "sid".');
    }

    if (typeof claims.sid !== 'undefined' && (typeof claims.sid !== 'string' || claims.sid.length === 0)) {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "sid".');
    }

    if (typeof claims.nonce !== 'undefined') {
      throw new InvalidJsonWebTokenClaimException('Prohibited claim "nonce".');
    }
  }
}
