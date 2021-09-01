import { Inject, Injectable } from '@guarani/ioc'
import { removeNullishValues } from '@guarani/utils'

import { Adapter } from '../adapter'
import { SupportedGrantType } from '../constants'
import {
  AccessToken,
  Client,
  OAuth2Token,
  RefreshToken,
  User
} from '../entities'
import { Settings } from '../settings'

/**
 * Base class for the OAuth 2.0 Grants defined by Guarani.
 */
@Injectable()
export abstract class Grant {
  /**
   * Name of the Grant.
   */
  public abstract readonly name: SupportedGrantType

  /**
   * Instantiates a new OAuth 2.0 Grant.
   *
   * @param adapter Adapter provided by the application.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    @Inject('Adapter') protected readonly adapter: Adapter,
    protected readonly settings: Settings
  ) {}

  /**
   * Issues a new OAuth 2.0 Token by creating a new Access Token
   * and Refresh Token.
   *
   * @param scopes Scopes granted to the Client.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @param issueRefreshToken Informs that a Refresh Token is necessary.
   * @returns Access Token and Refresh Token 2-tuple.
   */
  protected async issueOAuth2Token(
    scopes: string[],
    client: Client,
    user: User,
    issueRefreshToken: true
  ): Promise<[AccessToken, RefreshToken]>

  /**
   * Issues a new OAuth 2.0 Token by creating a new Access Token.
   *
   * @param scopes Scopes granted to the Client.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @param issueRefreshToken Informs that a Refresh Token is not necessary.
   * @returns Access Token 1-tuple.
   */
  protected async issueOAuth2Token(
    scopes: string[],
    client: Client,
    user: User,
    issueRefreshToken: false
  ): Promise<[AccessToken]>

  /**
   * Issues a new OAuth 2.0 Token.
   *
   * @param scopes Scopes granted to the Client.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @param issueRefreshToken Informs whether or not to issue a Refresh Token.
   * @returns Tuple with an Access Token and an optional Refresh Token.
   */
  protected async issueOAuth2Token(
    scopes: string[],
    client: Client,
    user: User,
    issueRefreshToken: boolean
  ): Promise<[AccessToken, RefreshToken?]> {
    const accessToken = await this.adapter.createAccessToken(
      this.name,
      scopes,
      client,
      user
    )

    const refreshToken =
      issueRefreshToken &&
      this.adapter.createRefreshToken &&
      client.checkGrantType('refresh_token')
        ? await this.adapter.createRefreshToken(
            scopes,
            client,
            user,
            accessToken
          )
        : null

    return [accessToken, refreshToken]
  }

  /**
   * Creates an OAuth 2.0 Token Response based on the provided
   * Access Token and Refresh Token.
   *
   * @param accessToken Access Token Entity.
   * @param refreshToken Optional Refresh Token Entity.
   * @returns OAuth 2.0 Token Response.
   */
  protected createTokenResponse(
    accessToken: AccessToken,
    refreshToken?: RefreshToken
  ): OAuth2Token {
    const expiresIn = Math.floor(
      (accessToken.getExpiresAt().getTime() - Date.now()) / 1000
    )

    return removeNullishValues<OAuth2Token>({
      access_token: accessToken.getToken(),
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: accessToken.getScopes().join(' '),
      refresh_token: refreshToken?.getToken()
    })
  }
}
