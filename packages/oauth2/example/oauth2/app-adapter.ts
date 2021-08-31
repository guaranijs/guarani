import { Dict } from '@guarani/utils'

import { Adapter } from '../../lib/adapter'
import { InvalidRequest, InvalidScope } from '../../lib/exceptions'
import { SupportedGrantType } from '../../lib/constants'
import {
  AccessToken,
  AuthorizationCode,
  Client,
  RefreshToken,
  User
} from '../entities'

export class AppAdapter implements Adapter {
  private readonly scopes = ['openid', 'profile', 'email', 'phone', 'address']
  private readonly lifespans: Partial<Record<SupportedGrantType, number>> = {
    authorization_code: 43200,
    client_credentials: 300,
    implicit: 3600,
    password: 43200
  }

  public async findClient(clientId: string): Promise<Client> {
    return await Client.findOne({ where: { id: clientId } })
  }

  public async findUser(userId: string): Promise<User> {
    return await User.findOne({ where: { id: userId } })
  }

  public async findUserByUsername(username: string): Promise<User> {
    return await User.findOne({ where: { email: username } })
  }

  public async checkClientScope(
    client: Client,
    scope: string
  ): Promise<string[]> {
    if (!scope) {
      const defaultScopes = client.scopes

      if (defaultScopes == null || defaultScopes.length === 0) {
        throw new InvalidRequest({ description: 'Invalid parameter "scope".' })
      }

      return defaultScopes
    }

    const requestedScopes = scope.split(' ')

    requestedScopes.forEach(requestedScope => {
      if (!this.scopes.includes(requestedScope)) {
        throw new InvalidScope({
          description: `Unsupported scope "${requestedScope}".`
        })
      }
    })

    if (!client.checkScopes(requestedScopes)) {
      throw new InvalidScope({
        description: 'This Client is not allowed to request this scope.'
      })
    }

    return requestedScopes
  }

  public async createAccessToken(
    grant: SupportedGrantType,
    scopes: string[],
    client: Client,
    user?: User
  ): Promise<AccessToken> {
    const accessToken = new AccessToken({
      grant,
      expiresIn: this.lifespans[grant],
      client,
      scopes,
      user
    })

    await accessToken.save()

    return accessToken
  }

  public async findAccessToken(token: string): Promise<AccessToken> {
    return await AccessToken.findOne({ where: { token } })
  }

  public async revokeAccessToken(token: string): Promise<void> {
    const accessToken = await this.findAccessToken(token)

    if (accessToken) {
      await accessToken.softRemove()
    }
  }

  public async createRefreshToken(
    accessToken: AccessToken
  ): Promise<RefreshToken> {
    const refreshToken = new RefreshToken({
      accessToken,
      client: accessToken.client,
      scopes: accessToken.scopes,
      user: accessToken.user
    })

    await refreshToken.save()

    return refreshToken
  }

  public async findRefreshToken(token: string): Promise<RefreshToken> {
    return await RefreshToken.findOne({ where: { token } })
  }

  public async revokeRefreshToken(token: string): Promise<void> {
    const refreshToken = await this.findRefreshToken(token)

    if (refreshToken) {
      await refreshToken.softRemove()
    }
  }

  public async createAuthorizationCode(
    data: Dict,
    scopes: string[],
    client: Client,
    user: User
  ): Promise<AuthorizationCode> {
    const code = new AuthorizationCode({
      client,
      codeChallenge: data.code_challenge,
      codeChallengeMethod: data.code_challenge_method,
      redirectUri: data.redirect_uri,
      scopes,
      user
    })

    await code.save()

    return code
  }

  public async findAuthorizationCode(code: string): Promise<AuthorizationCode> {
    return await AuthorizationCode.findOne({ where: { code } })
  }

  public async revokeAuthorizationCode(code: string): Promise<void> {
    const authorizationCode = await this.findAuthorizationCode(code)

    if (authorizationCode) {
      await authorizationCode.remove()
    }
  }
}
