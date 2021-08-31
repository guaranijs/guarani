import { Injectable } from '@guarani/ioc'

import { SupportedGrantType } from '../constants'
import { Request } from '../context'
import { Client, OAuth2Token, User } from '../entities'
import { InvalidGrant } from '../exceptions'
import { Grant } from './grant'
import { GrantType, TokenParameters as BaseTokenParameters } from './grant-type'

/**
 * Defines the parameters of the **Password Grant's** Token Request.
 */
interface TokenParameters extends BaseTokenParameters {
  /**
   * Username of the User represented by the Client.
   */
  readonly username: string

  /**
   * Password of the User represented by the Client.
   */
  readonly password: string

  /**
   * Scope requested by the Client.
   */
  readonly scope?: string
}

@Injectable()
export class PasswordGrant extends Grant implements GrantType {
  public readonly name: SupportedGrantType = 'password'

  public readonly grantType: SupportedGrantType = 'password'

  public async token(request: Request, client: Client): Promise<OAuth2Token> {
    const data = <TokenParameters>request.data

    const scopes = await this.adapter.checkClientScope(client, data.scope)
    const user = await this.authenticate(data.username, data.password)

    const [accessToken, refreshToken] = await this.issueOAuth2Token(
      scopes,
      client,
      user,
      true
    )

    return this.createTokenResponse(accessToken, refreshToken)
  }

  /**
   * Searches for a User in the application's storage via the
   * username and returns it if it succeeds, otherwise returns `undefined`.
   *
   * @param username Username of the User to be fetched.
   * Notice that the `username` does not necessarily mean that a username field
   * has to be defined at the User Model. It can mean anything from a username
   * to an email, custom ID, personal documentation, phone number or anything
   * that the application used to identify a single User.
   * @param password Password of the User.
   * @returns User based on the provided Username.
   */
  private async authenticate(
    username: string,
    password: string
  ): Promise<User> {
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
