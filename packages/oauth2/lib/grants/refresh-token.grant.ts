import { Inject, Injectable } from '@guarani/ioc'

import { Adapter } from '../adapter'
import { TokenRequest as BaseTokenRequest } from '../endpoints'
import { InvalidGrant, InvalidRequest, InvalidScope } from '../exceptions'
import { OAuth2Client, OAuth2RefreshToken, OAuth2Token } from '../models'
import { generateToken } from '../utils/token'
import { TokenGrant } from './token-grant'

interface TokenRequest extends BaseTokenRequest {
  readonly refresh_token: string
  readonly scope?: string
}

@Injectable()
export class RefreshTokenGrant implements TokenGrant {
  public readonly grantType: string = 'refresh_token'

  public constructor(@Inject('Adapter') protected readonly adapter: Adapter) {}

  public async token(
    data: TokenRequest,
    client: OAuth2Client
  ): Promise<OAuth2Token> {
    this.checkTokenRequest(data)

    const token = await this.findRefreshToken(data.refresh_token)

    this.checkRefreshToken(token, client)

    const scopes = this.getRefreshTokenScopes(token, data, client)
    const user = await this.adapter.findUser(token.getUserId())

    const accessToken = await this.adapter.createAccessToken(
      client,
      user,
      scopes
    )

    const refreshToken = client.checkGrantType(this.grantType)
      ? await this.adapter.createRefreshToken(client, user, scopes)
      : null

    return generateToken(accessToken, refreshToken)
  }

  protected checkTokenRequest(data: TokenRequest): void {
    const { refresh_token, scope } = data

    if (!refresh_token || typeof refresh_token !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "refresh_token".'
      })
    }

    if (scope && typeof scope !== 'string') {
      throw new InvalidRequest({ description: 'Invalid parameter "scope".' })
    }
  }

  private async findRefreshToken(
    refreshToken: string
  ): Promise<OAuth2RefreshToken> {
    const token = await this.adapter.findRefreshToken(refreshToken)

    if (!token) {
      throw new InvalidGrant({ description: 'Invalid Refresh Token.' })
    }

    return token
  }

  protected checkRefreshToken(
    token: OAuth2RefreshToken,
    client: OAuth2Client
  ): void {
    if (client.getId() !== token.getClientId()) {
      throw new InvalidGrant({ description: 'Invalid Refresh Token.' })
    }

    if (token.isExpired()) {
      throw new InvalidGrant({ description: 'Refresh Token Expired.' })
    }
  }

  private getRefreshTokenScopes(
    refreshToken: OAuth2RefreshToken,
    data: TokenRequest,
    client: OAuth2Client
  ): string[] {
    if (!data.scope) {
      return refreshToken.getScopes()
    }

    const scopes = client.checkScope(data.scope)

    if (!scopes) {
      throw new InvalidScope({
        description: 'This Client is not allowed to request this scope.'
      })
    }

    const requestedScopes = new Set(scopes)
    const grantedScopes = new Set(refreshToken.getScopes())

    if (requestedScopes.size > grantedScopes.size) {
      throw new InvalidScope({ description: 'Invalid broader scope.' })
    }

    requestedScopes.forEach(scope => {
      if (!grantedScopes.has(scope)) {
        throw new InvalidScope({
          description: `The scope "${scope}" was not previously granted.`
        })
      }
    })

    return scopes
  }
}
