import { Inject, Injectable } from '@guarani/ioc'

import { Adapter } from '../adapter'
import { TokenRequest as BaseTokenRequest } from '../endpoints'
import { AccessDenied, InvalidGrant, InvalidRequest } from '../exceptions'
import { OAuth2Client, OAuth2Token, OAuth2User } from '../models'
import { generateToken } from '../utils/token'
import { TokenGrant } from './token-grant'

interface TokenRequest extends BaseTokenRequest {
  readonly username: string
  readonly password: string
  readonly scope: string
}

@Injectable()
export class ResourceOwnerPasswordCredentialsGrant implements TokenGrant {
  public readonly grantType: string = 'password'

  public constructor(@Inject('Adapter') protected readonly adapter: Adapter) {}

  public async token(
    data: TokenRequest,
    client: OAuth2Client
  ): Promise<OAuth2Token> {
    this.checkTokenRequest(data)

    const scopes = this.checkScope(client, data)
    const user = await this.authenticate(data.username, data.password)

    const accessToken = await this.adapter.createAccessToken(
      client,
      user,
      scopes
    )

    const refreshToken = client.checkGrantType('refresh_token')
      ? await this.adapter.createRefreshToken(client, user, scopes)
      : null

    return generateToken(accessToken, refreshToken)
  }

  protected checkTokenRequest(data: TokenRequest): void {
    const { username, password, scope } = data

    if (!username || typeof username !== 'string') {
      throw new InvalidRequest({ description: 'Invalid parameter "username".' })
    }

    if (!password || typeof password !== 'string') {
      throw new InvalidRequest({ description: 'Invalid parameter "password".' })
    }

    if (!scope || typeof scope !== 'string') {
      throw new InvalidRequest({ description: 'Invalid parameter "scope".' })
    }
  }

  private checkScope(client: OAuth2Client, data: TokenRequest): string[] {
    const scopes = client.checkScope(data.scope)

    if (!scopes) {
      throw new AccessDenied({
        description: 'This Client is not allowed to request this scope.'
      })
    }

    return scopes
  }

  /**
   * Searches for a User in the application's storage via the
   * username and returns it if it succeeds, otherwise returns `undefined`.
   *
   * @param username - Username of the User to be fetched.
   * Notice that the `username` does not necessarily mean that a username field
   * has to be defined at the User Model. It can mean anything
   * from a username to an email, custom ID, personal documentation,
   * phone number or anything that the application used to identify a single User.
   * @returns User based on the provided Username.
   */
  protected async authenticate(
    username: string,
    password: string
  ): Promise<OAuth2User> {
    const user = await this.adapter.findUserByUsername(username)

    if (!user) {
      throw new InvalidGrant({ description: 'Invalid Credentials.' })
    }

    if (!(await user.checkPassword(password))) {
      throw new InvalidGrant({ description: 'Invalid Credentials.' })
    }

    return user
  }
}
