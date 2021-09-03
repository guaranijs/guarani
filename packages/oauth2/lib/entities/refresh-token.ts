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

export namespace RefreshToken {
  /**
   * Checks if the provided token is a Refresh Token.
   *
   * @param token Token to be checked.
   */
  export function isRefreshToken(token: unknown): token is RefreshToken {
    return (<RefreshToken>token).getAccessToken != null
  }
}
