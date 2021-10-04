import { Inject, Injectable } from '@guarani/ioc'
import { OneOrMany, removeNullishValues } from '@guarani/utils'

import { Adapter } from '../adapter'
import { SupportedGrantType } from '../constants'
import {
  AbstractToken,
  AccessToken,
  Client,
  RefreshToken,
  User
} from '../entities'
import { OAuth2Error } from '../exception'
import { Settings } from '../settings'

/**
 * Defines the parameters of the OAuth 2.0 Token Response.
 */
export interface OAuth2Token {
  /**
   * Access Token issued.
   */
  readonly access_token: string

  /**
   * Type of the Access Token.
   */
  readonly token_type: string

  /**
   * Lifespan of the Access Token in seconds.
   */
  readonly expires_in: number

  /**
   * Scopes granted to the Client.
   */
  readonly scope: string

  /**
   * Refresh Token issued.
   */
  readonly refresh_token?: string

  /**
   * Optional parameters to be appended by Guarani.
   */
  [parameter: string]: any
}

/**
 * Base class for the OAuth 2.0 Grants defined by Guarani.
 */
@Injectable()
export abstract class Grant {
  /**
   * Name of the Grant.
   */
  public abstract readonly name: SupportedGrantType

  /**
   * Instantiates a new OAuth 2.0 Grant.
   *
   * @param adapter Adapter provided by the application.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    @Inject('Adapter') protected readonly adapter: Adapter,
    protected readonly settings: Settings
  ) {}

  /**
   * Checks if the requested Resource is a subset of the Resource previously
   * requested by the Client.
   *
   * @param token Token provided by the Client.
   * @param resource Resource requested by the Client.
   */
  protected checkTokenResource(
    token: AbstractToken,
    resource: OneOrMany<string>
  ): void {
    if (resource == null) {
      return
    }

    const audience = token.getAudience()

    if (audience == null) {
      throw OAuth2Error.InvalidTarget('No resource was previously requested.')
    }

    if (typeof resource === 'string') {
      if (
        (typeof audience === 'string' && resource !== audience) ||
        (Array.isArray(audience) && !audience.includes(resource))
      ) {
        throw OAuth2Error.InvalidTarget(
          'The requested resource was not previously granted.'
        )
      }
    }

    if (Array.isArray(resource)) {
      if (typeof audience === 'string') {
        throw OAuth2Error.InvalidTarget(
          'Only one resource was previously requested.'
        )
      }

      if (resource.some(res => !audience.includes(res))) {
        throw OAuth2Error.InvalidTarget(
          'The requested resource was not previously granted.'
        )
      }
    }
  }

  /**
   * Checks the validity of the Resource URI(s) requested by the Client and,
   * if valid, returns the Audience and Scopes of the Authorization Process.
   *
   * @param resource Resource URI(s) requested by the Client.
   * @param scopes Scopes requested by the Client.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @returns Audience to whom the token will be issued to, and the Scopes
   *     granted to the requested Audience.
   */
  protected async getAudienceScopes(
    resource: OneOrMany<string>,
    scopes: string[],
    client: Client,
    user: User
  ): Promise<[OneOrMany<string>, string[]]> {
    if (resource == null || !this.adapter.getAudienceScopes) {
      return [null, null]
    }

    return await this.adapter.getAudienceScopes(resource, scopes, client, user)
  }

  /**
   * Issues a new OAuth 2.0 Token by creating a new Access Token
   * and Refresh Token.
   *
   * @param scopes Scopes granted to the Client.
   * @param audience Intended Audience of the OAuth 2.0 Tokens.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @param issueRefreshToken Informs that a Refresh Token is necessary.
   * @returns Access Token and Refresh Token 2-tuple.
   */
  protected async issueOAuth2Tokens(
    scopes: string[],
    audience: OneOrMany<string>,
    client: Client,
    user: User,
    issueRefreshToken: true
  ): Promise<[AccessToken, RefreshToken]>

  /**
   * Issues a new OAuth 2.0 Token by creating a new Access Token.
   *
   * @param scopes Scopes granted to the Client.
   * @param audience Intended Audience of the OAuth 2.0 Tokens.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @param issueRefreshToken Informs that a Refresh Token is not necessary.
   * @returns Access Token 1-tuple.
   */
  protected async issueOAuth2Tokens(
    scopes: string[],
    audience: OneOrMany<string>,
    client: Client,
    user: User,
    issueRefreshToken: false
  ): Promise<[AccessToken]>

  /**
   * Issues a new OAuth 2.0 Token.
   *
   * @param scopes Scopes granted to the Client.
   * @param audience Intended Audience of the OAuth 2.0 Tokens.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @param issueRefreshToken Informs whether or not to issue a Refresh Token.
   * @returns Tuple with an Access Token and an optional Refresh Token.
   */
  protected async issueOAuth2Tokens(
    scopes: string[],
    audience: OneOrMany<string>,
    client: Client,
    user: User,
    issueRefreshToken: boolean
  ): Promise<[AccessToken, RefreshToken?]> {
    const accessToken = await this.adapter.createAccessToken(
      this.name,
      scopes,
      audience,
      client,
      user
    )

    const refreshToken =
      issueRefreshToken &&
      this.adapter.createRefreshToken &&
      client.checkGrantType('refresh_token')
        ? await this.adapter.createRefreshToken(
            scopes,
            audience,
            client,
            user,
            accessToken
          )
        : null

    return [accessToken, refreshToken]
  }

  /**
   * Creates an OAuth 2.0 Token Response based on the provided
   * Access Token and Refresh Token.
   *
   * @param accessToken Access Token Entity.
   * @param refreshToken Optional Refresh Token Entity.
   * @returns OAuth 2.0 Token Response.
   */
  protected createOAuth2Token(
    accessToken: AccessToken,
    refreshToken?: RefreshToken
  ): OAuth2Token {
    const expiresIn = Math.floor(
      (accessToken.getExpiresAt().getTime() - Date.now()) / 1000
    )

    const token = removeNullishValues<OAuth2Token>({
      access_token: accessToken.getIdentifier(),
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: accessToken.getScopes().join(' '),
      refresh_token: refreshToken?.getIdentifier()
    })

    return token
  }
}
