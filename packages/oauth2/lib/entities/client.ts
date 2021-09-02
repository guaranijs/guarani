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
export abstract class Client {
  /**
   * Returns the ID of the Client.
   */
  public abstract getClientId(): string

  /**
   * Checks the provided Secret against the Client's Secret.
   *
   * @param secret Secret provided by the Client.
   */
  public abstract checkSecret(secret: string): Promise<boolean>

  /**
   * Returns the Default Redirect URI of the Client.
   */
  public abstract getDefaultRedirectUri(): string

  /**
   * Checks if the Client is allowed to use the provided Redirect URI.
   *
   * @param redirectUri Redirect URI provided by the Client.
   */
  public abstract checkRedirectUri(redirectUri: string): boolean

  /**
   * Checks if the Client is allowed to request the provided Scopes.
   *
   * @param scopes Scopes requested by the Client.
   */
  public abstract checkScopes(scopes: string[]): boolean

  /**
   * Checks if the Client is allowed to use the requested Authentication Method.
   *
   * @param method Authentication Method used by the Client.
   */
  public abstract checkAuthenticationMethod(
    method: SupportedClientAuthentication
  ): boolean

  /**
   * Checks if the Client is allowed to use the provided Grant Type.
   *
   * @param grantType Grant Type used by the Client.
   */
  public abstract checkGrantType(grantType: SupportedGrantType): boolean

  /**
   * Checks if the Client is allowed to use the provided Response Type.
   *
   * @param responseType Response Type used by the Client.
   */
  public abstract checkResponseType(
    responseType: SupportedResponseType
  ): boolean
}
