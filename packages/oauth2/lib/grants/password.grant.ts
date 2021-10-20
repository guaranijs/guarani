import { Injectable } from '@guarani/ioc'

import { Request } from '../context'
import { Client, User } from '../entities'
import { InvalidGrant, InvalidRequest } from '../exceptions'
import { Grant, OAuth2Token } from './grant'
import { GrantType, TokenParameters as BaseTokenParameters } from './grant-type'

/**
 * Defines the parameters of the **Password Grant's** Token Request.
 */
export interface TokenParameters extends BaseTokenParameters {
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

/**
 * Implementation of the Authorization Code Grant as described in
 * {@link https://www.rfc-editor.org/rfc/rfc6749.html#section-4.3 RFC 6749}.
 *
 * In this grant the Client must obtain the **username** and **password**
 * of the User and present them as the User's grant to the Authorization Server.
 */
@Injectable()
export abstract class PasswordGrant
  extends Grant
  implements GrantType<TokenParameters> {
  /**
   * Name of the Grant.
   */
  public readonly name: string = 'password'

  /**
   * Name of the Grant's Grant Type.
   */
  public readonly GRANT_TYPE: string = 'password'

  /**
   * **Token Flow** of the Password Grant.
   *
   * In this flow the Authorization Server checks the `username` and `password`
   * provided by the Client on behalf of the User, checks if the credentials
   * are valid, and issues an Access Token and, if allowed to the Client,
   * a Refresh Token.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @returns OAuth 2.0 Token Response.
   */
  public async token(
    request: Request<TokenParameters>,
    client: Client
  ): Promise<OAuth2Token> {
    const { data } = request

    const scopes = await this.adapter.checkClientScope(client, data.scope)
    const user = await this.authenticate(data.username, data.password)

    if (!user) {
      throw new InvalidGrant('Invalid Credentials.')
    }

    const [audience, grantedScopes] = await this.getAudienceScopes(
      data.resource,
      scopes,
      client,
      user
    )

    const [accessToken, refreshToken] = await this.issueOAuth2Tokens(
      grantedScopes ?? scopes,
      audience,
      client,
      user,
      true
    )

    return this.createOAuth2Token(accessToken, refreshToken)
  }

  /**
   * Checks the parameters of the Token Request.
   *
   * @param data Parameters of the Token Request.
   * @throws {InvalidRequest} One or more authorization parameters are invalid.
   */
  protected checkTokenParameters(data: TokenParameters): void {
    const { username, password } = data

    if (!username) {
      throw new InvalidRequest('Invalid parameter "username".')
    }

    if (!password) {
      throw new InvalidRequest('Invalid parameter "password".')
    }
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
  protected abstract authenticate(
    username: string,
    password: string
  ): Promise<User>
}
