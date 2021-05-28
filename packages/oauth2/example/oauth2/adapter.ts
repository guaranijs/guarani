import { Dict, Objects } from '@guarani/utils'

import { getConnection } from 'typeorm'
import { v4 as uuid4 } from 'uuid'

import { Adapter } from '../../lib/adapter'
import { TokenMetadata } from '../../lib/models'
import {
  AccessToken,
  AuthorizationCode,
  Client,
  RefreshToken,
  User
} from '../entities'

export class AppAdapter implements Adapter {
  public async findClient(id: string): Promise<Client> {
    return await Client.findOne(id)
  }

  public async findUser(id: string): Promise<User> {
    return await User.findOne(id)
  }

  public async findUserByUsername(username: string): Promise<User> {
    return await User.findOne({ where: { email: username } })
  }

  public async createAccessToken(
    client: Client,
    user: User,
    scopes: string[]
  ): Promise<AccessToken> {
    const token = new AccessToken({ client, scopes, user })
    await token.save()
    return token
  }

  public async findAccessToken(accessToken: string): Promise<AccessToken> {
    return await AccessToken.findOne(accessToken)
  }

  public async deleteAccessToken(accessToken: string): Promise<void> {
    const token = await AccessToken.findOne(accessToken)

    if (token) {
      await token.remove()
    }
  }

  public async createAuthorizationCode(
    scopes: string[],
    data: Dict<any>,
    client: Client,
    user: User
  ): Promise<AuthorizationCode> {
    const code = new AuthorizationCode({
      client_id: client.id,
      code: uuid4(),
      code_challenge: data.code_challenge,
      code_challenge_method: data.code_challenge_method,
      redirect_uri: data.redirect_uri,
      scopes,
      user_id: user.id
    })

    await code.save()
    return code
  }

  public async findAuthorizationCode(code: string): Promise<AuthorizationCode> {
    return await AuthorizationCode.findOne(code)
  }

  public async deleteAuthorizationCode(code: string): Promise<void> {
    await AuthorizationCode.remove(code)
  }

  public async createRefreshToken(
    client: Client,
    user: User,
    scopes: string[]
  ): Promise<RefreshToken> {
    const token = await RefreshToken.findOne({ where: { client, user } })

    if (token) {
      if (!token.isExpired()) {
        return token
      }

      await token.remove()
    }

    const refreshToken = new RefreshToken({ client, scopes, user })
    await refreshToken.save()
    return refreshToken
  }

  public async findRefreshToken(refreshToken: string): Promise<RefreshToken> {
    return await RefreshToken.findOne(refreshToken)
  }

  public async deleteRefreshToken(refreshToken: string): Promise<void> {
    const token = await RefreshToken.findOne(refreshToken)

    if (token) {
      const accessTokens = await AccessToken.find({
        where: { client: token.client, user: token.user }
      })

      await getConnection().transaction(async manager => {
        await manager.remove(accessTokens)
        await manager.remove(token)
      })
    }
  }

  public async getTokenMetadata(
    client: Client,
    token: AccessToken | RefreshToken
  ): Promise<TokenMetadata> {
    if (token.getClientId() !== client.getId()) {
      return { active: false }
    }

    const expiration = Math.floor(token.expiration.getTime() / 1000)

    if (token instanceof AccessToken) {
      return Objects.removeNullishValues<TokenMetadata>({
        active: true,
        scope: token.scopes.join(' '),
        client_id: token.client.id,
        username: token.user?.email,
        token_type: 'Bearer',
        exp: expiration,
        iat: expiration - 3600,
        sub: token.getUserId() ?? token.getClientId(),
        iss: 'http://localhost:3333'
      })
    }

    if (token instanceof RefreshToken) {
      return Objects.removeNullishValues<TokenMetadata>({
        active: true,
        scope: token.scopes.join(' '),
        client_id: token.client.id,
        username: token.user.email,
        exp: expiration,
        iat: expiration - 1209600, // two weeks
        sub: token.user.id,
        iss: 'http://localhost:3333'
      })
    }
  }
}
