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
