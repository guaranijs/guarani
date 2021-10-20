import { JsonWebKey } from '@guarani/jose'

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
   * Returns the Secret of the Client.
   */
  getClientSecret(): Promise<string>

  /**
   * Returns a Public Key of the Client.
   */
  getPublicKey(keyId?: string): Promise<JsonWebKey>

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
  checkAuthenticationMethod(method: string): boolean

  /**
   * Checks if the Client is allowed to use the provided Grant Type.
   *
   * @param grantType Grant Type used by the Client.
   */
  checkGrantType(grantType: string): boolean

  /**
   * Checks if the Client is allowed to use the provided Response Type.
   *
   * @param responseType Response Type used by the Client.
   */
  checkResponseType(responseType: string): boolean
}
