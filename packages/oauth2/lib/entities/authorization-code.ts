import { SupportedPkceMethod } from '../constants'
import { Client } from './client'
import { User } from './user'

/**
 * Defines the model of the `OAuth 2.0 Authorization Code` used by Guarani.
 *
 * The application's Authorization Code **MUST** implement this interface.
 */
export interface AuthorizationCode {
  /**
   * Returns the String representation of the Authorization Code.
   */
  getCode(): string

  /**
   * Returns the Redirect URI provided by the Client.
   */
  getRedirectUri(): string

  /**
   * Returns the Scopes requested by the Client.
   */
  getScopes(): string[]

  /**
   * Returns the Code Challenge provided by the Client.
   */
  getCodeChallenge(): string

  /**
   * Returns the PKCE Method chosen by the Client.
   */
  getCodeChallengeMethod(): SupportedPkceMethod

  /**
   * Returns the Expiration Date of the Authorization Code.
   */
  getExpiresAt(): Date

  /**
   * Returns the Client to whom the Authorization Code was issued to.
   */
  getClient(): Client

  /**
   * Returns the User that authorized the Client.
   */
  getUser(): User
}
