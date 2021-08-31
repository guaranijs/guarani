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

@Injectable()
export abstract class Grant {
  public abstract readonly name: SupportedGrantType

  public constructor(
    @Inject('Adapter') protected readonly adapter: Adapter,
    protected readonly settings: Settings
  ) {}

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
        ? await this.adapter.createRefreshToken(accessToken)
        : null

    return [accessToken, refreshToken]
  }

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
