import { JsonWebTokenClaims } from '@guarani/jose'
import { Adapter, InvalidRequest, InvalidScope } from '@guarani/oauth2'
import { OneOrMany } from '@guarani/utils'

import { AccessToken, Client, RefreshToken, User } from '../entities'

export class AppAdapter implements Adapter {
  private readonly scopes = ['openid', 'profile', 'email', 'phone', 'address']
  private readonly lifespans: Partial<Record<string, number>> = {
    authorization_code: 43200,
    client_credentials: 300,
    implicit: 3600,
    password: 43200,
    'urn:ietf:params:oauth:grant-type:jwt-bearer': 3600
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
        throw new InvalidRequest('Invalid parameter "scope".')
      }

      return defaultScopes
    }

    const requestedScopes = scope.split(' ')

    requestedScopes.forEach(requestedScope => {
      if (!this.scopes.includes(requestedScope)) {
        throw new InvalidScope(`Unsupported scope "${requestedScope}".`)
      }
    })

    if (!client.checkScopes(requestedScopes)) {
      throw new InvalidScope(
        'This Client is not allowed to request this scope.'
      )
    }

    return requestedScopes
  }

  public async createAccessToken(
    grant: string,
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

  public async checkJWTAssertionClaims(
    claims: JsonWebTokenClaims
  ): Promise<void> {
    if (!claims.jti) {
      throw new Error('Missing JTI.')
    }
  }

  // eslint-disable-next-line
  public async getUserinfo(user: User, scopes: string[]): Promise<any> {
    return null
  }

  public async generateIdToken(
    claims: any, // eslint-disable-line
    client: Client, // eslint-disable-line
    user: User // eslint-disable-line
  ): Promise<any> {
    return null
  }
}
