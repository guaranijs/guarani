import { SupportedGrantType } from '../constants'
import { AbstractToken } from './abstract-token'

/**
 * Defines the model of the `OAuth 2.0 Access Token` used by Guarani.
 *
 * The application's Access Token **MUST** implement this interface.
 */
export interface AccessToken extends AbstractToken {
  /**
   * Returns the name of the Grant that generated this Access Token.
   */
  getGrant(): SupportedGrantType
}

export namespace AccessToken {
  /**
   * Checks if the provided token is an Access Token.
   *
   * @param token Token to be checked.
   */
  export function isAccessToken(token: unknown): token is AccessToken {
    return (<AccessToken>token).getGrant != null
  }
}
