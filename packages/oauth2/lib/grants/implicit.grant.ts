import { Injectable } from '@guarani/ioc'

import {
  SupportedGrantType,
  SupportedResponseMode,
  SupportedResponseType
} from '../constants'
import { Request } from '../context'
import { Client, OAuth2Token, User } from '../entities'
import { Grant } from './grant'
import { AuthorizationParameters, ResponseType } from './response-type'

@Injectable()
export class ImplicitGrant extends Grant implements ResponseType {
  public readonly name: SupportedGrantType = 'implicit'

  public readonly responseTypes: SupportedResponseType[] = [
    'id_token',
    'id_token token',
    'token'
  ]

  public readonly defaultResponseMode: SupportedResponseMode = 'fragment'

  public async authorize(
    request: Request,
    client: Client,
    user: User
  ): Promise<OAuth2Token> {
    const data = <AuthorizationParameters>request.data

    const scopes = await this.adapter.checkClientScope(client, data.scope)
    const [accessToken] = await this.issueOAuth2Token(
      scopes,
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
