import { Inject, Injectable } from '@guarani/ioc'
import { OneOrMany, removeNullishValues } from '@guarani/utils'

import { timingSafeEqual } from 'crypto'
import { OutgoingHttpHeaders } from 'http'

import { Adapter } from '../adapter'
import { ClientAuthenticator } from '../client-authentication'
import { SupportedEndpoint, SupportedTokenTypeHint } from '../constants'
import { JsonResponse, Request, Response } from '../context'
import { Client } from '../entities'
import {
  InvalidRequest,
  OAuth2Error,
  ServerError,
  UnsupportedTokenType
} from '../exceptions'
import { Settings } from '../settings'
import { Endpoint } from './endpoint'

/**
 * Defines the default parameters of the Introspection Request.
 */
export interface IntrospectionParameters {
  /**
   * Token to be introspected.
   */
  readonly token: string

  /**
   * Optional hint about the type of the token.
   */
  readonly token_type_hint?: SupportedTokenTypeHint
}

/**
 * Defines the format of the Introspection Response.
 */
export interface IntrospectionResponse {
  /**
   * Indicates if the token is active.
   */
  readonly active: boolean

  /**
   * Scope of the token.
   */
  readonly scope?: string

  /**
   * ID of the Client of the token.
   */
  readonly client_id?: string

  /**
   * Human-readable identifier of the User that authorized the token.
   */
  readonly username?: string

  /**
   * Type of the token.
   */
  readonly token_type?: string

  /**
   * Expiration date of the token in UTC seconds.
   */
  readonly exp?: number

  /**
   * Date of issuance of the token in UTC seconds.
   */
  readonly iat?: number

  /**
   * Date when the token will become valid in UTC seconds.
   */
  readonly nbf?: number

  /**
   * ID of the Subject of the token.
   */
  readonly sub?: string

  /**
   * Audience to whom the token was issued.
   */
  readonly aud?: OneOrMany<string>

  /**
   * Identifier of the Authorization Server that issued the token.
   */
  readonly iss?: string

  /**
   * Identifier of the token.
   */
  readonly jti?: string

  /**
   * Optional parameters.
   */
  [parameter: string]: any
}

/**
 * Endpoint used by the Client to obtain information about a token
 * in its possession.
 *
 * If the Client succeeds to authenticate but provides a token that was
 * not issued to itself, or if the token is already invalid, does not exist
 * within the Provider, or is otherwise unknown or invalid, the Provider
 * will return a standard response of the format `{"active": false}`.
 *
 * If every verification step passes, then the Provider returns the information
 * associated to the token back to the Client.
 */
@Injectable()
export class IntrospectionEndpoint implements Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: SupportedEndpoint = 'introspection'

  /**
   * List with the introspectable token types.
   */
  protected readonly SUPPORTED_TOKEN_TYPE_HINTS: SupportedTokenTypeHint[] = [
    'access_token'
  ]

  /**
   * Default HTTP headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache'
  }

  /**
   * Instantiates the Introspection Endpoint.
   *
   * @param adapter Adapter provided by the application.
   * @param settings Settings of the Authorization Server.
   * @param clientAuthenticator Client Authenticator instance.
   */
  public constructor(
    @Inject('Adapter') private readonly adapter: Adapter,
    private readonly settings: Settings,
    private readonly clientAuthenticator: ClientAuthenticator
  ) {}

  /**
   * Introspects the provided token about its metadata and state
   * within the Authorization Server.
   *
   * First it validates the Introspection Request of the Client by making
   * sure the required parameter **token** is present, and that the Client
   * can authenticate with the allowed authentication methods.
   *
   * It then tries to lookup the information about the token from the
   * application's storage. The parameter **token_type_hint** is ignored,
   * and it first searches for an Access Token. If no Access Token is found,
   * and if the introspection of Refresh Tokens is allowed, it will search
   * for a Refresh Token.
   *
   * If the Client passes the authentication, the token is still valid,
   * and the Client is the rightful owner of the token, this method will
   * return the token's metadata back to the Client. If it is determined
   * that the Client should not have access to the token's metadata, or if
   * the token is not valid anymore, this method will return an Introspection
   * Response in the format `{"active": false}`.
   *
   * This is done in order to prevent a Client from fishing any information that
   * it should not have access to.
   *
   * @param request Current Request.
   * @returns Introspection Response with the metadata of the token.
   */
  public async handle(request: Request): Promise<Response> {
    const data = <IntrospectionParameters>request.data

    try {
      this.checkParameters(data)

      const client = await this.clientAuthenticator.authenticate(request)
      const introspectionResponse = await this.introspectToken(client, data)

      return new JsonResponse(introspectionResponse).setHeaders(this.headers)
    } catch (error) {
      const err =
        error instanceof OAuth2Error
          ? error
          : new ServerError({ description: error.message })

      return new JsonResponse(removeNullishValues(err))
        .status(err.status_code)
        .setHeaders({ ...this.headers, ...err.headers })
    }
  }

  /**
   * Checks the parameter of the Introspection Request.
   *
   * @param data Parameters of the Introspection Request.
   */
  private checkParameters(data: IntrospectionParameters): void {
    const { token, token_type_hint } = data

    if (!token) {
      throw new InvalidRequest({ description: 'Invalid parameter "token".' })
    }

    if (
      token_type_hint &&
      !this.SUPPORTED_TOKEN_TYPE_HINTS.includes(token_type_hint)
    ) {
      throw new UnsupportedTokenType({
        description: `Unsupported token_type_hint "${token_type_hint}".`
      })
    }
  }

  /**
   * Introspects the provided token for its metadata.
   *
   * @param client Client of the Request.
   * @param data Parameters of the Introspection Request.
   * @returns Introspection Response with the metadata of the token.
   */
  protected async introspectToken(
    client: Client,
    data: IntrospectionParameters
  ): Promise<IntrospectionResponse> {
    let tokenClientId: Buffer
    const clientId = Buffer.from(client.getClientId())

    const accessToken = await this.adapter.findAccessToken(data.token)

    if (accessToken) {
      tokenClientId = Buffer.from(accessToken.getClient().getClientId())

      if (!timingSafeEqual(clientId, tokenClientId)) {
        return
      }

      if (accessToken.isRevoked() || new Date() > accessToken.getExpiresAt()) {
        return { active: false }
      }

      return removeNullishValues<IntrospectionResponse>({
        active: true,
        scope: accessToken.getScopes().join(' '),
        client_id: accessToken.getClient().getClientId(),
        username: null,
        token_type: 'Bearer',
        exp: Math.floor(accessToken.getExpiresAt().getTime() / 1000),
        iat: Math.floor(accessToken.getIssuedAt().getTime() / 1000),
        nbf: null,
        sub:
          accessToken.getUser()?.getUserId() ??
          accessToken.getClient().getClientId(),
        aud: null,
        iss: this.settings.issuer,
        jti: null
      })
    }

    if (!this.SUPPORTED_TOKEN_TYPE_HINTS.includes('refresh_token')) {
      return { active: false }
    }

    const refreshToken = await this.adapter.findRefreshToken(data.token)

    if (refreshToken) {
      tokenClientId = Buffer.from(refreshToken.getClient().getClientId())

      if (!timingSafeEqual(clientId, tokenClientId)) {
        return
      }

      if (
        refreshToken.isRevoked() ||
        new Date() > refreshToken.getExpiresAt()
      ) {
        return { active: false }
      }

      return removeNullishValues<IntrospectionResponse>({
        active: true,
        scope: refreshToken.getScopes().join(' '),
        client_id: refreshToken.getClient().getClientId(),
        username: null,
        token_type: 'Bearer',
        exp: Math.floor(refreshToken.getExpiresAt().getTime() / 1000),
        iat: Math.floor(refreshToken.getIssuedAt().getTime() / 1000),
        nbf: null,
        sub: refreshToken.getUser().getUserId(),
        aud: null,
        iss: this.settings.issuer,
        jti: null
      })
    }

    return { active: false }
  }
}
