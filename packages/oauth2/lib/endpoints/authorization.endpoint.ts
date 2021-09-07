import { Inject, Injectable, InjectAll } from '@guarani/ioc'

import { URL } from 'url'

import { Adapter } from '../adapter'
import {
  GUARANI_ENV,
  SupportedEndpoint,
  SupportedResponseMode,
  SupportedResponseType
} from '../constants'
import { RedirectResponse, Request, Response } from '../context'
import { Client, User } from '../entities'
import {
  AccessDenied,
  InvalidClient,
  InvalidRequest,
  OAuth2Error,
  ServerError,
  UnauthorizedClient,
  UnsupportedResponseType
} from '../exceptions'
import { ResponseMode } from '../response-modes'
import { AuthorizationParameters, ResponseType } from '../grants'
import { Settings } from '../settings'
import { Endpoint } from './endpoint'

export interface UserConsent {
  readonly client: Client
  readonly scopes: string[]
}

/**
 * Endpoint used to provide an Authorization Grant for the requesting Client
 * on behalf of the authenticated User.
 *
 * Since the OAuth 2.0 Spec does not define the need for authentication when
 * using this endpoint, it is left omitted.
 */
@Injectable()
export class AuthorizationEndpoint implements Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: SupportedEndpoint = 'authorization'

  /**
   * Instantiates the Authorization Endpoint.
   *
   * @param adapter Adapter provided by the application.
   * @param grants Response Type Grants provided by the application.
   * @param responseModes Response Modes provided by the application.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    @Inject('Adapter') private readonly adapter: Adapter,
    @InjectAll('Grant') private readonly grants: ResponseType[],
    @InjectAll('ResponseMode') private readonly responseModes: ResponseMode[],
    private readonly settings: Settings
  ) {}

  /**
   * URL of the OAuth 2.0 Error Page.
   */
  private get errorUrl(): string {
    return new URL(this.settings.errorUrl, this.settings.issuer).href
  }

  /**
   * Fetches the parameters of the User Consent from the Authorization Request.
   *
   * @param request Current Request.
   * @returns User Consent parameters.
   */
  public async getUserConsent(request: Request): Promise<UserConsent> {
    try {
      const data = <AuthorizationParameters>request.data

      const client = await this.getClient(data.client_id)

      this.getGrant(data.response_type)
      this.checkClientResponseType(client, data.response_type)
      this.checkClientRedirectUri(client, data.redirect_uri)

      const scopes = await this.adapter.checkClientScope(client, data.scope)

      return { client, scopes }
    } catch (error) {
      throw error instanceof OAuth2Error
        ? error
        : new ServerError({ description: GUARANI_ENV ? error.message : null })
    }
  }

  /**
   * Creates an **Authorization Response** via a **User-Agent Redirection**.
   *
   * Any error is safely redirected to the **Redirect URI** provided by the
   * Client in the Authorization Request or to the **Provider's Error Endpoint**.
   *
   * If the flow of the endpoint results in a successful response,
   * it will also redirect the User-Agent to the provided Redirect URI.
   *
   * This endpoint is to be used by Grants that have an Authorization Workflow,
   * and it **REQUIRES** consent given by the User, be it implicit or explicit.
   *
   * The means of which the application obtains the consent of the User has
   * to be defined in the Framework Integration, since it usually requires
   * a redirection to an endpoint that is not supported by OAuth 2.0.
   *
   * If this method is hit, it assumes that the User has given consent
   * to whatever scopes were requested by the Client.
   *
   * @param request Current Request.
   * @returns Authorization Response.
   */
  public async handle(request: Request): Promise<Response> {
    const data = <AuthorizationParameters>request.data

    let client: Client, redirectUri: string, responseMode: ResponseMode

    try {
      client = await this.getClient(data.client_id)

      this.checkClientResponseType(client, data.response_type)

      redirectUri = this.checkClientRedirectUri(client, data.redirect_uri)
    } catch (error) {
      return this.handleError(this.errorUrl, error)
    }

    try {
      const user = this.getUser(request)
      const grant = this.getGrant(data.response_type)

      responseMode = this.getResponseMode(
        data.response_mode || grant.defaultResponseMode
      )

      const response = await grant.authorize(request, client, user)

      return responseMode.createResponse(redirectUri, response)
    } catch (error) {
      return this.handleError(redirectUri, error, responseMode)
    }
  }

  /**
   * Fetches a Client from the application's storage based on the provided ID.
   *
   * @param clientId ID of the Client of the Request.
   * @throws {InvalidClient} The Client is not valid.
   * @returns Object representing the current Client.
   */
  private async getClient(clientId: string): Promise<Client> {
    const client = await this.adapter.findClient(clientId)

    if (!client) {
      throw new InvalidClient({ description: 'Invalid Client.' })
    }

    return client
  }

  /**
   * Checks if the Client is allowed to use the requested Response Type.
   *
   * @param client Client requesting authorization.
   * @param responseType Response Type requested by the Client.
   * @throws {UnauthorizedClient} The Client is not allowed to use
   *   the requested Response Type.
   */
  private checkClientResponseType(
    client: Client,
    responseType: SupportedResponseType
  ): void {
    if (!client.checkResponseType(responseType)) {
      throw new UnauthorizedClient({
        description:
          'This Client is not allowed to request ' +
          `the response_type "${responseType}".`
      })
    }
  }

  /**
   * Checks the provided Redirect URI against the registered
   * Redirect URIs of the Client.
   *
   * @param client Client requesting authorization.
   * @param redirectUri Redirect URI provided by the Client.
   * @throws {AccessDenied} The Client is not allowed to use the Redirect URI.
   * @returns Redirect URI provided by the Client.
   */
  private checkClientRedirectUri(client: Client, redirectUri: string): string {
    if (!redirectUri) {
      const defaultRedirectUri = client.getDefaultRedirectUri()

      if (!defaultRedirectUri) {
        throw new InvalidRequest({
          description: 'Invalid parameter "redirect_uri".'
        })
      }

      return defaultRedirectUri
    }

    if (!client.checkRedirectUri(redirectUri)) {
      throw new AccessDenied({ description: 'Invalid Redirect URI.' })
    }

    return redirectUri
  }

  /**
   * Fetches the User from the Request if it has given consent, otherwise,
   * denies access to the Client.
   *
   * @param request Current Request.
   * @returns Object representing the User of the Request.
   */
  private getUser(request: Request): User {
    const { user } = request

    if (!user) {
      throw new AccessDenied({
        description: 'Authorization denied by the user.'
      })
    }

    return user
  }

  /**
   * Retrieves the requested Grant based on the **response_type** parameter.
   *
   * @param responseType Requested Response Type.
   * @throws {UnsupportedResponseType} The requested grant is unsupported.
   * @returns Grant based on the requested **response_type**.
   */
  private getGrant(responseType: SupportedResponseType): ResponseType {
    // Alphabetic sorting of the Response Types.
    responseType = <SupportedResponseType>(
      responseType.split(' ').sort().join(' ')
    )

    const grant = this.grants.find(grant =>
      (grant.responseTypes ?? []).includes(responseType)
    )

    if (!grant) {
      throw new UnsupportedResponseType({
        description: `Unsupported response_type "${responseType}".`
      })
    }

    return grant
  }

  /**
   * Retrieves the requested Response Mode based on the
   * **response_mode** parameter.
   *
   * @param responseMode Requested Response Mode.
   * @returns Response Mode based on the requested **response_mode**.
   */
  private getResponseMode(responseMode: SupportedResponseMode): ResponseMode {
    const mode = this.responseModes.find(mode => mode.name === responseMode)

    if (!mode) {
      throw new InvalidRequest({
        description: `Unsupported response_mode "${responseMode}".`
      })
    }

    return mode
  }

  /**
   * Handles the Authorization Errors that may arise in the
   * Authorization process.
   *
   * @param redirectUri Redirect URI used by the Redirect Response.
   * @param error Error thrown by the Endpoint.
   * @param responseMode Response Mode used to generate the Redirect Response.
   * @returns Authorization Error Response.
   */
  private handleError(
    redirectUri: string,
    error: Error,
    responseMode?: ResponseMode
  ): Response {
    const err =
      error instanceof OAuth2Error
        ? error
        : new ServerError({ description: GUARANI_ENV ? error.message : null })

    try {
      responseMode ??= this.getResponseMode('query')
    } catch {
      return this._createErrorResponse(err)
    }

    return responseMode.createResponse(redirectUri, err.toJSON())
  }

  /**
   * Fallback method for when a Fatal Error was raised and the Response Mode
   * **query** is not supported by the Provider.
   *
   * @param error Error raised during the Authorization Flow.
   * @returns Redirect Response to the Provider's Error page.
   */
  private _createErrorResponse(error: OAuth2Error): RedirectResponse {
    const url = new URL(this.errorUrl)

    Object.entries(error.toJSON()).forEach(([name, value]) =>
      url.searchParams.set(name, value)
    )

    return new RedirectResponse(url.href)
  }
}
