import { Inject, Injectable, InjectAll } from '@guarani/ioc'
import { removeNullishValues } from '@guarani/utils'

import { timingSafeEqual } from 'crypto'
import { OutgoingHttpHeaders } from 'http'

import { Adapter } from '../adapter'
import { ClientAuthenticator } from '../client-authentication'
import {
  SupportedClientAuthentication,
  SupportedEndpoint,
  SupportedTokenTypeHint
} from '../constants'
import { EmptyResponse, JsonResponse, Request, Response } from '../context'
import { Client } from '../entities'
import {
  InvalidRequest,
  OAuth2Error,
  ServerError,
  UnsupportedTokenType
} from '../exceptions'
import { Grant } from '../grants'
import { Endpoint } from './endpoint'

/**
 * Defines the default parameters of the Revocation Request.
 */
interface RevocationParameters {
  /**
   * Token to be revoked.
   */
  readonly token: string

  /**
   * Optional hint about the type of the token.
   */
  readonly token_type_hint?: SupportedTokenTypeHint
}

/**
 * Endpoint used by the Client to revoke a token in its possession.
 *
 * If the Client succeeds to authenticate but provides a token that was
 * not issued to itself, the Provider **DOES NOT** revoke the token,
 * since the Client is not authorized to operate the token.
 *
 * If the token is already invalid, does not exist within the Provider
 * or is otherwise unknown or invalid, it is already considered "revoked".
 */
// TODO: Fix the foul fiends present at the _revoke() methods.
@Injectable()
export class RevocationEndpoint implements Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: SupportedEndpoint = 'revocation'

  /**
   * List of the Client Authentication Methods supported by the Endpoint.
   */
  protected readonly CLIENT_AUTHENTICATION_METHODS: SupportedClientAuthentication[] = [
    'client_secret_basic'
  ]

  /**
   * List with the revocable token types.
   */
  protected readonly SUPPORTED_TOKEN_TYPE_HINTS: SupportedTokenTypeHint[] = [
    'access_token',
    'refresh_token'
  ]

  /**
   * Default HTTP headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache'
  }

  /**
   * Instantiates the Revocation Endpoint.
   *
   * @param adapter Adapter provided by the application.
   * @param grants OAuth 2.0 Grants requested by the application.
   * @param clientAuthenticator Client Authenticator instance.
   */
  public constructor(
    @Inject('Adapter') private readonly adapter: Adapter,
    @InjectAll('Grant') private readonly grants: Grant[],
    private readonly clientAuthenticator: ClientAuthenticator
  ) {
    // The Spec mandates the support for revoking Refresh Tokens.
    if (!this.grants.find(grant => grant.name === 'refresh_token')) {
      throw new Error('The Provider does not support Refresh Tokens.')
    }
  }

  /**
   * Revokes a previously issued Token.
   *
   * First it validates the Revocation Request of the Client by making sure
   * the required parameter **token** is present, and that the Client can
   * authenticate with the allowed authentication methods.
   *
   * It then tries to revoke the provided token from the application's storage.
   * The parameter **token_type_hint** is ignored, and it tries to first remove
   * a Refresh Token and, if it fails, tries to remove an Access Token.
   *
   * Unless the Client presented an unsupported **token_type_hint**, failed to
   * authenticate or did not present a **token**, it will **ALWAYS** return a
   * `success` response.
   *
   * This is done in order to prevent a Client from fishing any information that
   * it should not have access to.
   *
   * @param request Current Request.
   * @returns Empty Body Response signaling the success of the Revocation.
   */
  public async handle(request: Request): Promise<Response> {
    const data = <RevocationParameters>request.body

    try {
      this.checkParameters(data)

      const client = await this.clientAuthenticator.authenticate(
        request,
        this.CLIENT_AUTHENTICATION_METHODS
      )

      await this.revokeToken(client, data.token)

      return new EmptyResponse().setHeaders(this.headers)
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
   * Checks the parameter of the Revocation Request.
   *
   * @param data Parameters of the Revocation Request.
   */
  private checkParameters(data: RevocationParameters): void {
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
   * Revokes the provided token.
   *
   * @param client Client of the Request.
   * @param token Token provided by the Client.
   */
  protected async revokeToken(client: Client, token: string): Promise<void> {
    let tokenClientId: Buffer
    const clientId = Buffer.from(client.getClientId())

    const refreshToken = await this.adapter.findRefreshToken(token)

    if (refreshToken) {
      tokenClientId = Buffer.from(refreshToken.getClient().getClientId())

      if (!timingSafeEqual(clientId, tokenClientId)) {
        return
      }

      await this.adapter.revokeRefreshToken(refreshToken)
      await this.adapter.revokeAccessToken(refreshToken.getAccessToken())

      return
    }

    const accessToken = await this.adapter.findAccessToken(token)

    if (accessToken) {
      tokenClientId = Buffer.from(accessToken.getClient().getClientId())

      if (!timingSafeEqual(clientId, tokenClientId)) {
        return
      }

      return await this.adapter.revokeAccessToken(accessToken)
    }
  }
}
