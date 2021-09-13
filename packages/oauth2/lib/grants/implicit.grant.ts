import { Injectable } from '@guarani/ioc'

import {
  SupportedGrantType,
  SupportedResponseMode,
  SupportedResponseType
} from '../constants'
import { Request } from '../context'
import { Client, User } from '../entities'
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
  public readonly RESPONSE_TYPES: SupportedResponseType[] = [
    'id_token',
    'id_token token',
    'token'
  ]

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

    const scopes = await this.adapter.checkClientScope(client, data.scope)
    const [audience, grantedScopes] = await this.getAudienceScopes(
      data.resource,
      scopes,
      client,
      user
    )

    const [accessToken] = await this.issueOAuth2Token(
      grantedScopes ?? scopes,
      audience,
      client,
      user,
      false
    )

    const token = this.createTokenResponse(accessToken)

    if (data.state) {
      token.state = data.state
    }

    return token
  }
}
