import { OneOrMany } from '@guarani/utils'

import { Adapter } from '../../lib/adapter'
import { InvalidRequest, InvalidScope } from '../../lib/exceptions'
import { SupportedGrantType } from '../../lib/constants'
import { AccessToken, Client, RefreshToken, User } from '../entities'

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
    audience: OneOrMany<string>,
    client: Client,
    user: User
  ): Promise<AccessToken> {
    const accessToken = new AccessToken({
      grant,
      expiresIn: this.lifespans[grant],
      client,
      scopes,
      audience,
      user
    })

    await accessToken.save()

    return accessToken
  }

  public async createRefreshToken(
    scopes: string[],
    audience: OneOrMany<string>,
    client: Client,
    user: User,
    accessToken: AccessToken
  ): Promise<RefreshToken> {
    const refreshToken = new RefreshToken({
      accessToken,
      client,
      audience,
      scopes,
      user
    })

    await refreshToken.save()

    return refreshToken
  }
}
