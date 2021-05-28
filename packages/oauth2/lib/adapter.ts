import { Dict } from '@guarani/utils'

import {
  OAuth2AccessToken,
  OAuth2AuthorizationCode,
  OAuth2Client,
  OAuth2RefreshToken,
  OAuth2User,
  TokenMetadata
} from './models'

/**
 * Adapter interface that contains the common methods used throughout Guarani.
 *
 * These methods are used by multiple authentication methods, endpoints
 * and/or grants and, therefore, to respect the DRY principle, they are
 * defined in this interface.
 *
 * The application **MUST** provide a concrete implementation of the methods
 * defined in this interface.
 */
export interface Adapter {
  /**
   * Searches for a Client in the application's storage
   * and returns it if it succeeds, otherwise returns `undefined`.
   *
   * @param id - ID of the Client to be fetched.
   * @returns Client based on the provided ID.
   */
  findClient(id: string): Promise<OAuth2Client>

  /**
   * Searches for a User in the application's storage
   * and returns it if it succeeds, otherwise returns `undefined`.
   *
   * @param id - ID of the User to be fetched.
   * @returns User based on the provided ID.
   */
  findUser(id: string): Promise<OAuth2User>

  /**
   * Searches for a User in the application's storage
   * and returns it if it succeeds, otherwise returns `undefined`.
   *
   * @param username - Username of the User to be fetched.
   * @returns User based on the provided Username.
   */
  findUserByUsername?(username: string): Promise<OAuth2User>

  /**
   * Generates an `Access Token` that creates a tight coupling between
   * the Client, the User and the Scopes granted to the Client.
   *
   * The structure of the Access Token is left undefined by this framework,
   * but it is **RECOMMENDED** that the application uses a
   * **Json Web Token (JWT)** for the Access Token,
   * following the specifications at
   * {@link https://tools.ietf.org/html/draft-ietf-oauth-access-token-jwt
   * |JWT Profile for OAuth 2 Access Tokens}.
   *
   * The format of the **Token Response** is as follows,
   * with values displayed as example only, not defining a format
   * for any of the Tokens:
   *
   * ```json
   *   {
   *     "access_token": "vlOa11kBoziWFBsQiUu59SjgHJbi7spU80Ew5xCTZ9UhZmWN",
   *     "token_type": "Bearer",
   *     "expires_in": 3600,
   *     "refresh_token": "7eqGioGLs-O7ky3CgeAU87bfijRam6r5",
   *     "scope": "api user:profile"
   *   }
   * ```
   *
   * Since the Refresh Token is optional when the User
   * is separate from the Client, and not recommended when the Client
   * is the User, its presence in the final response is optional.
   *
   * @param client - Client requesting the Access Token.
   * @param user - User that authorized the Client.
   * @param scopes - Scopes granted to the Client.
   * @returns `Access Token` for authorized use by the Client.
   */
  createAccessToken(
    client: OAuth2Client,
    user: OAuth2User,
    scopes: string[]
  ): Promise<OAuth2AccessToken>

  findAccessToken?(accessToken: string): Promise<OAuth2AccessToken>

  deleteAccessToken?(accessToken: string): Promise<void>

  createAuthorizationCode?(
    scopes: string[],
    data: Dict<any>,
    client: OAuth2Client,
    user: OAuth2User
  ): Promise<OAuth2AuthorizationCode>

  findAuthorizationCode?(code: string): Promise<OAuth2AuthorizationCode>

  deleteAuthorizationCode?(code: string): Promise<void>

  createRefreshToken?(
    client: OAuth2Client,
    user: OAuth2User,
    scopes: string[]
  ): Promise<OAuth2RefreshToken>

  findRefreshToken?(refreshToken: string): Promise<OAuth2RefreshToken>

  deleteRefreshToken?(refreshToken: string): Promise<void>

  getTokenMetadata?(
    client: OAuth2Client,
    token: OAuth2AccessToken | OAuth2RefreshToken
  ): Promise<TokenMetadata>
}
