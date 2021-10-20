import { Injectable } from '@guarani/ioc'
import { OneOrMany } from '@guarani/utils'

import { OutgoingHttpHeaders } from 'http'

import { ClientAuthenticator } from '../client-authentication'
import {
  SupportedClientAuthentication,
  SupportedEndpoint,
  SupportedTokenTypeHint
} from '../constants'
import { JsonResponse, Request, Response } from '../context'
import { Client } from '../entities'
import { OAuth2Error } from '../exception'
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
export abstract class IntrospectionEndpoint extends Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name = SupportedEndpoint.Introspection

  /**
   * List of the Client Authentication Methods supported by the Endpoint.
   */
  protected readonly CLIENT_AUTHENTICATION_METHODS: SupportedClientAuthentication[] = [
    SupportedClientAuthentication.ClientSecretBasic
  ]

  /**
   * List with the introspectable token types.
   */
  protected readonly SUPPORTED_TOKEN_TYPE_HINTS: SupportedTokenTypeHint[] = [
    SupportedTokenTypeHint.AccessToken
  ]

  /**
   * Default HTTP headers to be included in the Response.
   */
  protected readonly headers: OutgoingHttpHeaders = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache'
  }

  /**
   * Defines the default response for errors and inactive tokens.
   */
  protected readonly inactiveToken: IntrospectionResponse = { active: false }

  /**
   * Instantiates the Introspection Endpoint.
   *
   * @param clientAuthenticator Client Authenticator instance.
   */
  public constructor(
    private readonly clientAuthenticator: ClientAuthenticator
  ) {
    super()
  }

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

      const client = await this.clientAuthenticator.authenticate(
        request,
        this.CLIENT_AUTHENTICATION_METHODS
      )

      const introspectionResponse = await this.introspectToken(client, data)

      return new JsonResponse(introspectionResponse).setHeaders(this.headers)
    } catch (error) {
      const err =
        error instanceof OAuth2Error
          ? error
          : OAuth2Error.ServerError(error.message)

      return new JsonResponse(err)
        .status(err.statusCode)
        .setHeaders({ ...this.headers, ...err.headers })
    }
  }

  /**
   * Checks the parameter of the Introspection Request.
   *
   * @param data Parameters of the Introspection Request.
   */
  protected checkParameters(data: IntrospectionParameters): void {
    const { token, token_type_hint } = data

    if (!token) {
      throw OAuth2Error.InvalidRequest('Invalid parameter "token".')
    }

    if (
      token_type_hint &&
      !this.SUPPORTED_TOKEN_TYPE_HINTS.includes(token_type_hint)
    ) {
      throw OAuth2Error.UnsupportedTokenType(
        `Unsupported token_type_hint "${token_type_hint}".`
      )
    }
  }

  /**
   * Introspects the provided token for its metadata.
   *
   * @param client Client of the Request.
   * @param data Parameters of the Introspection Request.
   * @returns Introspection Response with the metadata of the token.
   */
  protected abstract introspectToken(
    client: Client,
    data: IntrospectionParameters
  ): Promise<IntrospectionResponse>
}
