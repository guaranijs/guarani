import { Injectable, InjectAll } from '@guarani/ioc'

import { OutgoingHttpHeaders } from 'http'

import { ClientAuthenticator } from '../client-authentication'
import {
  SupportedClientAuthentication,
  SupportedEndpoint,
  SupportedTokenTypeHint
} from '../constants'
import { Request, Response } from '../context'
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
export interface RevocationParameters {
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
@Injectable()
export abstract class RevocationEndpoint extends Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name = SupportedEndpoint.Revocation

  /**
   * List of the Client Authentication Methods supported by the Endpoint.
   */
  protected readonly CLIENT_AUTHENTICATION_METHODS: SupportedClientAuthentication[] = [
    SupportedClientAuthentication.ClientSecretBasic
  ]

  /**
   * List with the revocable token types.
   */
  protected readonly SUPPORTED_TOKEN_TYPE_HINTS: SupportedTokenTypeHint[] = [
    SupportedTokenTypeHint.AccessToken,
    SupportedTokenTypeHint.RefreshToken
  ]

  /**
   * Default HTTP headers to be included in the Response.
   */
  protected readonly headers: OutgoingHttpHeaders = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache'
  }

  /**
   * Instantiates the Revocation Endpoint.
   *
   * @param grants OAuth 2.0 Grants requested by the application.
   * @param clientAuthenticator Client Authenticator instance.
   */
  public constructor(
    @InjectAll('Grant') private readonly grants: Grant[],
    private readonly clientAuthenticator: ClientAuthenticator
  ) {
    super()

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
  public async handle(
    request: Request<RevocationParameters>
  ): Promise<Response> {
    const { data } = request

    try {
      this.checkParameters(data)

      const client = await this.clientAuthenticator.authenticate(
        request,
        this.CLIENT_AUTHENTICATION_METHODS
      )

      await this.revokeToken(client, data)

      return new Response().setHeaders(this.headers)
    } catch (error) {
      const err =
        error instanceof OAuth2Error ? error : new ServerError(error.message)

      return new Response()
        .status(err.status)
        .setHeaders({ ...this.headers, ...err.headers })
        .json(err.toJSON())
    }
  }

  /**
   * Checks the parameter of the Revocation Request.
   *
   * @param data Parameters of the Revocation Request.
   */
  protected checkParameters(data: RevocationParameters): void {
    const { token, token_type_hint } = data

    if (!token) {
      throw new InvalidRequest('Invalid parameter "token".')
    }

    if (
      token_type_hint &&
      !this.SUPPORTED_TOKEN_TYPE_HINTS.includes(token_type_hint)
    ) {
      throw new UnsupportedTokenType(
        `Unsupported token_type_hint "${token_type_hint}".`
      )
    }
  }

  /**
   * Revokes the provided token.
   *
   * @param client Client of the Request.
   * @param data Parameters of the Revocation Request.
   */
  protected abstract revokeToken(
    client: Client,
    data: RevocationParameters
  ): Promise<void>
}
