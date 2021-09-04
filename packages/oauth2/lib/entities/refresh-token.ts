import { AbstractToken } from './abstract-token'
import { AccessToken } from './access-token'

/**
 * Defines the model of the `OAuth 2.0 Refresh Token` used by Guarani.
 *
 * The application's Refresh Token **MUST** implement this interface.
 */
export interface RefreshToken extends AbstractToken {
  /**
   * Returns the Access Token associated with this Refresh Token.
   */
  getAccessToken(): AccessToken
}
