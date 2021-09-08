import {
  SupportedClientAuthentication,
  SupportedGrantType,
  SupportedResponseType
} from '../constants'

/**
 * Defines the model of the `OAuth 2.0 Client` used by Guarani.
 *
 * The application's Client **MUST** implement this interface.
 */
export interface Client {
  /**
   * Returns the ID of the Client.
   */
  getClientId(): string

  /**
   * Checks the provided Secret against the Client's Secret.
   *
   * @param secret Secret provided by the Client.
   */
  checkSecret(secret: string): Promise<boolean>

  /**
   * Checks if the Client is allowed to use the provided Redirect URI.
   *
   * @param redirectUri Redirect URI provided by the Client.
   */
  checkRedirectUri(redirectUri: string): boolean

  /**
   * Checks if the Client is allowed to request the provided Scopes.
   *
   * @param scopes Scopes requested by the Client.
   */
  checkScopes(scopes: string[]): boolean

  /**
   * Checks if the Client is allowed to use the requested Authentication Method.
   *
   * @param method Authentication Method used by the Client.
   */
  checkAuthenticationMethod(method: SupportedClientAuthentication): boolean

  /**
   * Checks if the Client is allowed to use the provided Grant Type.
   *
   * @param grantType Grant Type used by the Client.
   */
  checkGrantType(grantType: SupportedGrantType): boolean

  /**
   * Checks if the Client is allowed to use the provided Response Type.
   *
   * @param responseType Response Type used by the Client.
   */
  checkResponseType(responseType: SupportedResponseType): boolean
}
