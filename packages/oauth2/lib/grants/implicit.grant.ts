import { Injectable } from '@guarani/ioc'
import { OneOrMany } from '@guarani/utils'

import {
  SupportedGrantType,
  SupportedResponseMode,
  SupportedResponseType
} from '../constants'
import { Request } from '../context'
import { AccessToken, Client, User } from '../entities'
import { OAuth2Error } from '../exception'
import { Grant, OAuth2Token } from './grant'
import { AuthorizationParameters, ResponseType } from './response-type'

/**
 * Implementation of the Implicit Grant as described in
 * {@link https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2 RFC 6749}.
 *
 * In this grant the Client obtains consent from the Authenticated User and
 * receives an Access Token without the need for a second visit to the Provider.
 * The Access Token is returned at the Redirect URI of the Client.
 *
 * This **COULD** lead to a potential security issue, since the URI is usually
 * saved at the browser's history. A malware could read the history and extract
 * the Access Token from one of the Authorization Responses.
 */
@Injectable()
export class ImplicitGrant extends Grant implements ResponseType {
  /**
   * Name of the Grant.
   */
  public readonly name: SupportedGrantType = 'implicit'

  /**
   * Names of the Grant's Response Types.
   */
  public readonly RESPONSE_TYPES: SupportedResponseType[] = ['token']

  /**
   * Default Response Mode of the Grant.
   */
  public readonly DEFAULT_RESPONSE_MODE: SupportedResponseMode = 'fragment'

  /**
   * **Authorization Flow** of the Implicit Grant.
   *
   * In this part of the Authorization process the Authorization Server checks
   * the **scopes** requested by the Client and, if authorized by the User,
   * issues an **Access Token** to the Client.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @returns OAuth 2.0 Token Response.
   */
  public async authorize(
    request: Request,
    client: Client,
    user: User
  ): Promise<OAuth2Token> {
    const data = <AuthorizationParameters>request.data

    this.checkAuthorizationParameters(data)

    const scopes = await this.adapter.checkClientScope(client, data.scope)

    let token: Partial<OAuth2Token> = {}

    const accessToken = await this.createAccessToken(
      scopes,
      data.resource,
      client,
      user
    )

    token = this.createOAuth2Token(accessToken)

    if (data.state) {
      token.state = data.state
    }

    return <OAuth2Token>token
  }

  /**
   * Checks the parameters of the Authorization Request.
   *
   * @param data Parameters of the Authorization Request.
   * @throws {InvalidRequest} One or more authorization parameters are invalid.
   */
  protected checkAuthorizationParameters(data: AuthorizationParameters): void {
    const { response_type, response_mode } = data

    if (response_mode === 'query') {
      throw OAuth2Error.InvalidRequest(
        `Invalid response_mode "${response_mode}" ` +
          `for response_type "${response_type}".`
      )
    }
  }

  /**
   * Generates the Access Token of the Authorization Request when
   * when the **response_type** is `token` or `id_token token`.
   *
   * @param scopes Scopes requested by the Client.
   * @param resource Resource URI(s) requested by the Client.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @returns **Access Token** for use by the Client.
   */
  private async createAccessToken(
    scopes: string[],
    resource: OneOrMany<string>,
    client: Client,
    user: User
  ): Promise<AccessToken> {
    const [audience, grantedScopes] = await this.getAudienceScopes(
      resource,
      scopes,
      client,
      user
    )

    const [accessToken] = await this.issueOAuth2Tokens(
      grantedScopes ?? scopes,
      audience,
      client,
      user,
      false
    )

    return accessToken
  }
}
