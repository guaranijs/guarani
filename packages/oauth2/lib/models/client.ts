/**
 * Defines the model of the `Client` used by this framework.
 *
 * The application's Client **MUST** implement **ALL** the methods defined here.
 */
export interface OAuth2Client {
  /**
   * ID of the Client.
   */
  getId(): string

  /**
   * Secret of the Client.
   */
  checkSecret(secret: string): Promise<boolean>

  /**
   * Name of the Client.
   */
  getName(): string

  /**
   * Redirect URIs of the Client.
   */
  checkRedirectUri(redirectUri: string): boolean

  /**
   * Scopes allowed to the Client.
   */
  checkScope(scope: string): string[]

  /**
   * Authentication Method of the Client.
   */
  checkTokenEndpointAuthMethod(method: string): boolean

  /**
   * Grant Types allowed to the Client.
   */
  checkGrantType(grantType: string): boolean

  /**
   * Response Types allowed to the Client.
   */
  checkResponseType(responseType: string): boolean
}
