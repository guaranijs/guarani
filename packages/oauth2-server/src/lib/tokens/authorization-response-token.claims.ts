import { InvalidJsonWebTokenClaimException, JsonWebTokenClaims } from '@guarani/jose';
import { OneOrMany } from '@guarani/types';

import { AuthorizationResponseTokenClaimsParameters } from './authorization-response-token.claims.parameters';

/**
 * OpenID Connect Authorization Response Token Claims Parameters.
 *
 * @see https://openid.net/specs/oauth-v2-jarm.html#section-2.1
 */
export class AuthorizationResponseTokenClaims
  extends JsonWebTokenClaims
  implements AuthorizationResponseTokenClaimsParameters
{
  /**
   * Identifier of the Issuer of the Authorization Response Token.
   */
  public override readonly iss!: string;

  /**
   * Identifier of the Audience the Authorization Response Token is intended to.
   */
  public override readonly aud!: OneOrMany<string>;

  /**
   * UTC time denoting the Expiration Time of the Authorization Response Token.
   */
  public override readonly exp!: number;

  /**
   * UTC time denoting the moment when the Authorization Response Token will become valid.
   */
  public override readonly nbf?: number;

  /**
   * UTC time denoting the moment when the Authorization Response Token was created.
   */
  public override readonly iat!: number;

  /**
   * Identifier of the Authorization Response Token.
   */
  public override readonly jti?: string;

  /**
   * Instantiates a new Authorization Response Token.
   *
   * @param claims Defines the claims of the Authorization Response Token.
   */
  public constructor(claims: AuthorizationResponseTokenClaimsParameters) {
    super(claims);
  }

  /**
   * Validates the claims of the Authorization Response Token.
   *
   * @param claims Claims of the Authorization Response Token.
   */
  protected static override validateCustomClaims(claims: AuthorizationResponseTokenClaimsParameters): void {
    if (typeof claims.iss === 'undefined') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iss".');
    }

    if (typeof claims.aud === 'undefined') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "aud".');
    }

    if (typeof claims.exp === 'undefined') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "exp".');
    }

    if (typeof claims.iat === 'undefined') {
      throw new InvalidJsonWebTokenClaimException('Invalid claim "iat".');
    }
  }
}
