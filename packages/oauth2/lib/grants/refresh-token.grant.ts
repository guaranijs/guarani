import { Injectable } from '@guarani/ioc'

import { SupportedGrantType } from '../constants'
import { Request } from '../context'
import { Client, OAuth2Token, RefreshToken } from '../entities'
import { InvalidGrant, InvalidRequest, InvalidScope } from '../exceptions'
import { Grant } from './grant'
import { GrantType, TokenParameters as BaseTokenParameters } from './grant-type'

/**
 * Defines the parameters of the **Refresh Token Grant's** Token Request.
 */
interface TokenParameters extends BaseTokenParameters {
  /**
   * Refresh Token provided by the Client.
   */
  readonly refresh_token: string

  /**
   * Scope requested by the Client.
   */
  readonly scope?: string
}

@Injectable()
export class RefreshTokenGrant extends Grant implements GrantType {
  public readonly name: SupportedGrantType = 'refresh_token'

  public readonly grantType: SupportedGrantType = 'refresh_token'

  public async token(request: Request, client: Client): Promise<OAuth2Token> {
    const data = <TokenParameters>request.data

    const oldRefreshToken = await this.getRefreshToken(data.refresh_token)

    this.checkRefreshToken(oldRefreshToken, client)

    const scopes = await this.getScopes(oldRefreshToken, data.scope)

    const accessToken = await this.adapter.createAccessToken(
      oldRefreshToken.getAccessToken().getGrant(),
      scopes,
      client,
      oldRefreshToken.getUser()
    )

    const refreshToken = await this.adapter.createRefreshToken(accessToken)

    await this.revokeRefreshToken(oldRefreshToken)

    return this.createTokenResponse(accessToken, refreshToken)
  }

  private async getRefreshToken(refreshToken: string): Promise<RefreshToken> {
    if (!refreshToken) {
      throw new InvalidRequest({
        description: 'Invalid parameter "refresh_token".'
      })
    }

    const token = await this.adapter.findRefreshToken(refreshToken)

    if (!token) {
      throw new InvalidGrant({ description: 'Invalid Refresh Token.' })
    }

    return token
  }

  private checkRefreshToken(refreshToken: RefreshToken, client: Client): void {
    // TODO: Security breach.
    if (refreshToken.getClient().getClientId() !== client.getClientId()) {
      throw new InvalidGrant({ description: 'Invalid Refresh Token.' })
    }

    if (new Date() > refreshToken.getExpiresAt() || refreshToken.isRevoked()) {
      throw new InvalidGrant({ description: 'Invalid Refresh Token.' })
    }
  }

  private async getScopes(
    refreshToken: RefreshToken,
    scope: string
  ): Promise<string[]> {
    if (!scope) {
      return refreshToken.getScopes()
    }

    const scopes = await this.adapter.checkClientScope(
      refreshToken.getClient(),
      scope
    )

    if (scopes.length > refreshToken.getScopes().length) {
      throw new InvalidScope({ description: 'Invalid broader scope.' })
    }

    if (scopes.some(scope => !refreshToken.getScopes().includes(scope))) {
      throw new InvalidScope({
        description: 'One or more requested scopes were not previously granted.'
      })
    }

    return scopes
  }

  private async revokeRefreshToken(refreshToken: RefreshToken): Promise<void> {
    await this.adapter.revokeRefreshToken(refreshToken.getToken())

    await this.adapter.revokeAccessToken(
      refreshToken.getAccessToken().getToken()
    )
  }
}
