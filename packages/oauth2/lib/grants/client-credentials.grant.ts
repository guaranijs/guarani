import { Injectable } from '@guarani/ioc'

import { SupportedGrantType } from '../constants'
import { Request } from '../context'
import { Client } from '../entities'
import { Grant, OAuth2Token } from './grant'
import { GrantType, TokenParameters as BaseTokenParameters } from './grant-type'

/**
 * Defines the parameters of the **Client Credentials Grant's** Token Request.
 */
export interface TokenParameters extends BaseTokenParameters {
  /**
   * Scope requested by the Client.
   */
  readonly scope?: string
}

/**
 * Implementation of the Client Credentials Grant as described in
 * {@link https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4 RFC 6749}.
 *
 * In this grant the Client exchanges its credentials for an Access Token.
 * At the most basic level, authenticating with the Token Endpoint is sufficient
 * for the issuance of an Access Token. A Refresh Token is **NOT** issued.
 */
@Injectable()
export class ClientCredentialsGrant
  extends Grant
  implements GrantType<TokenParameters> {
  /**
   * Name of the Grant.
   */
  public readonly name = SupportedGrantType.ClientCredentials

  /**
   * Name of the Grant's Grant Type.
   */
  public readonly GRANT_TYPE = SupportedGrantType.ClientCredentials

  /**
   * **Token Flow** of the Client Credentials Grant.
   *
   * In this flow the Authorization Server checks the credentials of the Client
   * and, if valid, issues an Access Token. A Refresh Token is **NOT** issued.
   *
   * Since the Client asks for an Access Token on behalf of itself, it is
   * **RECOMMENDED** that the Access Token is short lived.
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
    const [audience, grantedScopes] = await this.getAudienceScopes(
      data.resource,
      scopes,
      client,
      null
    )

    const [accessToken] = await this.issueOAuth2Tokens(
      grantedScopes ?? scopes,
      audience,
      client,
      null,
      false
    )

    return this.createOAuth2Token(accessToken)
  }
}
