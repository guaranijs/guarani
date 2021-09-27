import { JWTClaims } from '@guarani/jose'
import { OneOrMany } from '@guarani/utils'

import { UserinfoClaims } from './userinfo.claims'

/**
 * Defines the Claims about the Authentication status of an End-User
 * by the Authorization Server.
 */
export interface IdTokenClaims extends JWTClaims, UserinfoClaims {
  /**
   * Identifier for the Issuer of the response.
   */
  readonly iss: string

  /**
   * Subject Identifier of the User.
   */
  readonly sub: string

  /**
   * Audience(s) that the ID Token is intended for.
   */
  readonly aud: OneOrMany<string>

  /**
   * Expiration date of the ID Token.
   */
  readonly exp: number

  /**
   * Issuance date of the ID Token.
   */
  readonly iat: number

  /**
   * Time when the End-User authentication occurred.
   */
  readonly auth_time?: number

  /**
   * String value used to associate a **Client Session** with an **ID Token**,
   * and to mitigate replay attacks. The value is passed through unmodified
   * from the Authentication Request to the ID Token.
   */
  readonly nonce?: string

  /**
   * Optional additional claims.
   */
  [claim: string]: any
}
