import { Injectable } from '@guarani/ioc'

import { SupportedGrantType } from '../constants'
import { Request } from '../context'
import { Client, RefreshToken } from '../entities'
import { InvalidGrant, InvalidRequest, InvalidScope } from '../exceptions'
import { Grant, OAuth2Token } from './grant'
import { GrantType, TokenParameters } from './grant-type'

/**
 * Defines the parameters of the **Refresh Token Grant's** Token Request.
 */
export interface RefreshTokenTokenParameters extends TokenParameters {
  /**
   * Refresh Token provided by the Client.
   */
  readonly refresh_token: string

  /**
   * Scope requested by the Client.
   */
  readonly scope?: string
}

/**
 * Implementation of the Authorization Code Grant as described in
 * {@link https://www.rfc-editor.org/rfc/rfc6749.html#section-6 RFC 6749}.
 *
 * In this Grant the Client requests the Authorization Server for the issuance
 * of a new Access Token without the need to repeat the User Consent process.
 */
@Injectable()
export abstract class RefreshTokenGrant extends Grant implements GrantType {
  /**
   * Name of the Grant.
   */
  public readonly name: SupportedGrantType = 'refresh_token'

  /**
   * Name of the Grant's Grant Type.
   */
  public readonly GRANT_TYPE: SupportedGrantType = 'refresh_token'

  /**
   * **Token Flow** of the Refresh Token Grant.
   *
   * In this flow the Client uses the Refresh Token received by the Provider as
   * a grant to request a new Access Token without the need to trigger a new
   * User Consent process.
   *
   * If the Refresh Token presented is valid, the Authorization Server issues
   * a new Access Token and a new Refresh Token. It also invalidates the
   * provided Refresh Token, in a process called **Refresh Token Rotation**.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @returns OAuth 2.0 Token Response.
   */
  public async token(request: Request, client: Client): Promise<OAuth2Token> {
    const data = <RefreshTokenTokenParameters>request.data

    const oldRefreshToken = await this.getRefreshToken(data.refresh_token)

    this.checkRefreshToken(oldRefreshToken, client)
    this.checkTokenResource(oldRefreshToken, data.resource)

    const user = oldRefreshToken.getUser()

    const scopes = await this.getScopes(oldRefreshToken, data.scope)
    const [audience, accessTokenScopes] = await this.getAudienceScopes(
      data.resource ?? oldRefreshToken.getAudience(),
      scopes,
      client,
      user
    )

    const accessToken = await this.adapter.createAccessToken(
      oldRefreshToken.getAccessToken().getGrant(),
      accessTokenScopes ?? scopes,
      audience ?? oldRefreshToken.getAudience(),
      client,
      user
    )

    const refreshToken = await this.adapter.createRefreshToken(
      oldRefreshToken.getScopes(),
      oldRefreshToken.getAudience(),
      oldRefreshToken.getClient(),
      user,
      accessToken
    )

    await this.revokeRefreshToken(oldRefreshToken)

    return this.createOAuth2Token(accessToken, refreshToken)
  }

  /**
   * Checks the parameters of the Token Request.
   *
   * @param data Parameters of the Token Request.
   * @throws {InvalidRequest} One or more authorization parameters are invalid.
   */
  protected checkTokenParameters(data: RefreshTokenTokenParameters): void {
    const { refresh_token } = data

    if (!refresh_token) {
      throw new InvalidRequest({
        description: 'Invalid parameter "refresh_token".'
      })
    }
  }

  /**
   * Fetches the requested Refresh Token from the application's storage.
   *
   * @param token Token provided by the Client.
   * @returns Refresh Token based on the provided token.
   */
  private async getRefreshToken(token: string): Promise<RefreshToken> {
    const refreshToken = await this.findRefreshToken(token)

    if (!refreshToken) {
      throw new InvalidGrant({ description: 'Invalid Refresh Token.' })
    }

    return refreshToken
  }

  /**
   * Searches for an Refresh Token in the application's storage
   * and returns it.
   *
   * @param token Token to be fetched.
   * @returns Refresh Token based on the provided token.
   */
  protected abstract findRefreshToken(token: string): Promise<RefreshToken>

  /**
   * Checks the fetched Refresh Token against the Client.
   *
   * @param refreshToken Refresh Token fetched to be checked.
   * @param client Client of the Request.
   */
  private checkRefreshToken(refreshToken: RefreshToken, client: Client): void {
    if (refreshToken.getClient().getClientId() !== client.getClientId()) {
      throw new InvalidGrant({ description: 'Invalid Refresh Token.' })
    }

    if (new Date() > refreshToken.getExpiresAt() || refreshToken.isRevoked()) {
      throw new InvalidGrant({ description: 'Invalid Refresh Token.' })
    }
  }

  /**
   * Returns the original scopes of the provided Refresh Token or a subset
   * thereof, as requested by the Client.
   *
   * @param refreshToken Refresh Token provided by the Client.
   * @param scope Subset of scopes requested by the Client.
   * @returns Scopes of the new Access Token.
   */
  private async getScopes(
    refreshToken: RefreshToken,
    scope: string
  ): Promise<string[]> {
    if (!scope) {
      return refreshToken.getScopes()
    }

    const scopes = await this.adapter.checkClientScope(
      refreshToken.getClient(),
      scope
    )

    if (scopes.length > refreshToken.getScopes().length) {
      throw new InvalidScope({ description: 'Invalid broader scope.' })
    }

    if (scopes.some(scope => !refreshToken.getScopes().includes(scope))) {
      throw new InvalidScope({
        description: 'One or more requested scopes were not previously granted.'
      })
    }

    return scopes
  }

  /**
   * Revokes the provided Refresh Token and its associated Access Token
   * to prevent misuse and Replay Attacks.
   *
   * @param refreshToken Refresh Token provided by the Client.
   */
  protected abstract revokeRefreshToken(
    refreshToken: RefreshToken
  ): Promise<void>
}
