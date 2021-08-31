import { SupportedGrantType } from '../constants'
import { Client } from './client'
import { User } from './user'

/**
 * Defines the model of the `OAuth 2.0 Access Token` used by Guarani.
 *
 * The application's Access Token **MUST** implement this interface.
 */
export interface AccessToken {
  /**
   * Returns the String representation of the Access Token.
   */
  getToken(): string

  /**
   * Returns the Scopes of the Access Token.
   */
  getScopes(): string[]

  /**
   * Returns the name of the Grant that generated this Access Token.
   */
  getGrant(): SupportedGrantType

  /**
   * Returns the Expiration Date of the Access Token.
   */
  getExpiresAt(): Date

  /**
   * Returns the Creation Date of the Access Token.
   */
  getIssuedAt(): Date

  /**
   * Returns the Client to whom the Access Token was issued to.
   */
  getClient(): Client

  /**
   * Returns the User represented by the Client through the Access Token.
   */
  getUser(): User

  /**
   * Checks if the Access Token is revoked.
   */
  isRevoked(): boolean
}
