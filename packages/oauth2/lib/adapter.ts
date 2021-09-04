import { SupportedGrantType } from './constants'
import { AccessToken, Client, RefreshToken, User } from './entities'

/**
 * Adapter interface that contains the common methods used throughout Guarani.
 *
 * These methods are used by multiple authentication methods, endpoints
 * and/or grants and therefore, to respect the DRY principle, they are
 * defined in this interface.
 *
 * The application **MUST** provide a concrete implementation of the methods
 * defined in this interface.
 */
export interface Adapter {
  /**
   * Searches for a Client in the application's storage and
   * returns it.
   *
   * @param clientId ID of the Client to be fetched.
   * @returns Client based on the provided ID.
   */
  findClient(clientId: string): Promise<Client>

  /**
   * Searches for a User in the application's storage and
   * returns it.
   *
   * @param userId ID of the User to be fetched.
   * @returns User based on the provided ID.
   */
  findUser(userId: string): Promise<User>

  /**
   * Checks if the Scope requested by the Client is valid and, if so,
   * returns a list of the actual scopes granted to the Client.
   *
   * The returned scopes will, most of the time, be identical to the
   * scopes requested by the Client. On the other hand, there are
   * cases in which the Provider might allow only a subset of the
   * scopes requested.
   *
   * In any of the previous cases, if the Provider decides that the
   * scopes requested are reasonable, this method **MUST** return a
   * list of the allowed scopes. Otherwise, it **MUST** throw the
   * appropriated **OAuth2Error** describing the reason for rejection.
   *
   * @param client Client of the Request.
   * @param scope Scope requested by the Client.
   * @returns List of the scopes allowed by the Provider.
   */
  checkClientScope(client: Client, scope: string): Promise<string[]>

  /**
   * Generates an **Access Token** that creates a tight coupling
   * between the Client, the User and the Scopes granted to the Client.
   *
   * @param grant Name of the Grant that generated the Access Token.
   * @param scopes Scopes granted to the Client.
   * @param client Client requesting the Access Token.
   * @param user User represented by the Client through the Access Token.
   * @returns **Access Token** for authorized use by the Client.
   */
  createAccessToken(
    grant: SupportedGrantType,
    scopes: string[],
    client: Client,
    user?: User
  ): Promise<AccessToken>

  /**
   * Generates a **Refresh Token** that creates a tight coupling
   * between the Client, the User and the Scopes granted to the Client.
   *
   * **This method must be implemented **ONLY** if using
   * the **Refresh Token Grant**.
   *
   * @param scopes Scopes granted to the Client.
   * @param client Client requesting the Refresh Token.
   * @param user User that authorized the issuance of the Refresh Token.
   * @param accessToken Access Token associated with this Refresh Token.
   * @returns **Refresh Token** for use by the Client.
   */
  createRefreshToken?(
    scopes: string[],
    client: Client,
    user: User,
    accessToken: AccessToken
  ): Promise<RefreshToken>
}
