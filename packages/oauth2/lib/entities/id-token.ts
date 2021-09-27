import { getContainer } from '@guarani/ioc'
import { InvalidJsonWebTokenClaim, JsonWebTokenClaims } from '@guarani/jose'
import { OneOrMany, removeNullishValues } from '@guarani/utils'

import { Adapter } from '../adapter'
import { IdTokenClaims } from '../claims'
import { Settings } from '../settings'
import { Client } from './client'
import { User } from './user'

export class IdToken extends JsonWebTokenClaims implements IdTokenClaims {
  /**
   * Identifier for the Issuer of the response.
   */
  public readonly iss: string

  /**
   * Subject Identifier of the User.
   */
  public readonly sub: string

  /**
   * Audience(s) that the ID Token is intended for.
   */
  public readonly aud: OneOrMany<string>

  /**
   * Expiration date of the ID Token.
   */
  public readonly exp: number

  /**
   * Issuance date of the ID Token.
   */
  public readonly iat: number

  /**
   * Time when the End-User authentication occurred.
   */
  public readonly auth_time?: number

  /**
   * String value used to associate a **Client Session** with an **ID Token**,
   * and to mitigate replay attacks. The value is passed through unmodified
   * from the Authentication Request to the ID Token.
   */
  public readonly nonce?: string

  /**
   * Instantiates a new ID Token Claims for usage within OpenID Connect.
   *
   * @param claims Defines the claims of the ID Token.
   */
  public constructor(claims: IdToken)

  /**
   * Instantiates a new ID Token Claims for usage within OpenID Connect.
   *
   * @param claims Defines the claims of the ID Token.
   */
  public constructor(claims: IdTokenClaims)

  /**
   * Instantiates a new ID Token Claims for usage within OpenID Connect.
   *
   * @param claims Defines the claims of the ID Token.
   */
  public constructor(claims: IdToken | IdTokenClaims) {
    super(claims)
  }

  public static async generate(
    scopes: string[],
    nonce: string,
    lifespan: number,
    client: Client,
    user: User
  ): Promise<IdToken> {
    const container = getContainer('oauth2')
    const adapter = container.resolve<Adapter>('Adapter')
    const settings = container.resolve(Settings)

    const iat = Math.floor(Date.now() / 1000)

    const userinfo = await adapter.getUserinfo(user, scopes)

    return new IdToken(
      removeNullishValues<IdTokenClaims>({
        iss: settings.issuer,
        sub: user.getUserId(),
        aud: client.getClientId(),
        iat,
        exp: iat + lifespan,
        nonce,
        ...userinfo
      })
    )
  }

  /**
   * Validates the type of each ID Token claim and their semantic values
   * according to {@link https://openid.net/specs/openid-connect-core-1_0.html OpenID Connect}.
   *
   * @param claims Claims of the ID Token.
   * @throws {InvalidJsonWebTokenClaim} The received claim is invalid.
   */
  protected validateClaimsTypes(claims: IdTokenClaims): void {
    super.validateClaimsTypes(claims)

    if (
      'nonce' in claims &&
      (typeof claims.nonce !== 'string' || !claims.nonce)
    ) {
      throw new InvalidJsonWebTokenClaim('Invalid claim "nonce".')
    }

    if ('auth_time' in claims && typeof claims.auth_time !== 'number') {
      throw new InvalidJsonWebTokenClaim('Invalid claim "auth_time".')
    }
  }
}
