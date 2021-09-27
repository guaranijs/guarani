import { EcKey, JsonWebKeySet, JsonWebTokenClaims } from '@guarani/jose'
import {
  Adapter,
  InvalidRequest,
  InvalidScope,
  SupportedGrantType
} from '@guarani/oauth2'
import { Dict, OneOrMany } from '@guarani/utils'

import { AccessToken, Client, RefreshToken, User } from '../entities'

export class AppAdapter implements Adapter {
  private readonly scopes = ['openid', 'profile', 'email', 'phone', 'address']
  private readonly lifespans: Partial<Record<SupportedGrantType, number>> = {
    authorization_code: 43200,
    client_credentials: 300,
    implicit: 3600,
    password: 43200,
    'urn:ietf:params:oauth:grant-type:jwt-bearer': 3600
  }

  private readonly keys: JsonWebKeySet = new JsonWebKeySet([
    new EcKey({
      kty: 'EC',
      crv: 'P-256',
      x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
      y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
      d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      kid: 'ZyZA_70WXIx_sFJsPAJwPmYpKeRbii6G'
    })
  ])

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
    claims: Dict, // eslint-disable-line
    client: Client, // eslint-disable-line
    user: User // eslint-disable-line
  ): Promise<string> {
    return null
  }
}
