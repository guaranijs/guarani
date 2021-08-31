import { Injectable } from '@guarani/ioc'

import { SupportedGrantType } from '../constants'
import { Request } from '../context'
import { Client, OAuth2Token } from '../entities'
import { Grant } from './grant'
import { GrantType, TokenParameters as BaseTokenParameters } from './grant-type'

/**
 * Defines the parameters of the **Client Credentials Grant's** Token Request.
 */
interface TokenParameters extends BaseTokenParameters {
  /**
   * Scope requested by the Client.
   */
  readonly scope?: string
}

@Injectable()
export class ClientCredentialsGrant extends Grant implements GrantType {
  public readonly name: SupportedGrantType = 'client_credentials'

  public readonly grantType: SupportedGrantType = 'client_credentials'

  public async token(request: Request, client: Client): Promise<OAuth2Token> {
    const data = <TokenParameters>request.data
    const scopes = await this.adapter.checkClientScope(client, data.scope)

    const [accessToken] = await this.issueOAuth2Token(
      scopes,
      client,
      null,
      false
    )

    return this.createTokenResponse(accessToken)
  }
}
