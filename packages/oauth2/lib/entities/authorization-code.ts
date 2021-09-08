import { SupportedPkceMethod } from '../constants'
import { AbstractToken } from './abstract-token'

/**
 * Defines the model of the `OAuth 2.0 Authorization Code` used by Guarani.
 *
 * The application's Authorization Code **MUST** implement this interface.
 */
export interface AuthorizationCode extends AbstractToken {
  /**
   * Returns the Redirect URI provided by the Client.
   */
  getRedirectUri(): string

  /**
   * Returns the Code Challenge provided by the Client.
   */
  getCodeChallenge(): string

  /**
   * Returns the PKCE Method chosen by the Client.
   */
  getCodeChallengeMethod(): SupportedPkceMethod
}
