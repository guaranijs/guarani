import { AccessToken } from './access-token'
import { Client } from './client'
import { User } from './user'

/**
 * Defines the model of the `OAuth 2.0 Refresh Token` used by Guarani.
 *
 * The application's Refresh Token **MUST** implement this interface.
 */
export interface RefreshToken {
  /**
   * Returns the String representation of the Refresh Token.
   */
  getToken(): string

  /**
   * Returns the Scopes of the Refresh Token.
   */
  getScopes(): string[]

  /**
   * Returns the Access Token associated with this Refresh Token.
   */
  getAccessToken(): AccessToken

  /**
   * Returns the Expiration Date of the Refresh Token.
   */
  getExpiresAt(): Date

  /**
   * Returns the Creation Date of the Refresh Token.
   */
  getIssuedAt(): Date

  /**
   * Returns the Client to whom the Refresh Token was issued to.
   */
  getClient(): Client

  /**
   * Returns the User that authorized the Client the Refresh Token.
   */
  getUser(): User

  /**
   * Checks if the Refresh Token is revoked.
   */
  isRevoked(): boolean
}
