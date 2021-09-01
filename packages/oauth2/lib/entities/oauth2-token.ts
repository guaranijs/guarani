/**
 * Defines the parameters of the OAuth 2.0 Token Response.
 */
export interface OAuth2Token {
  /**
   * Access Token issued.
   */
  readonly access_token: string

  /**
   * Type of the Access Token.
   */
  readonly token_type: string

  /**
   * Lifespan of the Access Token in seconds.
   */
  readonly expires_in: number

  /**
   * Scopes granted to the Client.
   */
  readonly scope: string

  /**
   * Refresh Token issued.
   */
  readonly refresh_token?: string

  /**
   * Optional parameters to be appended by Guarani.
   */
  [parameter: string]: any
}
